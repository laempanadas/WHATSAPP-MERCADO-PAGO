import { Router } from 'express';
import { buscarPagamento } from '../services/payment.service.js';
import { enviarMensagemWhatsApp } from '../services/whatsapp.service.js';
import { mensagemNotificacaoDono } from '../services/messages.service.js';
import { marcarPago } from '../services/lembrete.service.js';

const router = Router();

/**
 * Memória dos pagamentos já processados (evita notificação duplicada).
 *
 * O Mercado Pago costuma disparar o webhook MAIS DE UMA VEZ para o mesmo
 * pagamento (ex.: payment.created e depois payment.updated). Sem proteção,
 * o dono receberia "NOVO PEDIDO PAGO" repetido. Guardamos o id do pagamento
 * com a hora; ids antigos são limpos automaticamente.
 */
const pagamentosProcessados = new Map();
const JANELA_DEDUPE_MS = 6 * 60 * 60 * 1000; // 6 horas

function jaProcessado(paymentId) {
  const id = String(paymentId);
  const agora = Date.now();
  // Limpa entradas antigas para não crescer indefinidamente.
  for (const [k, t] of pagamentosProcessados.entries()) {
    if (agora - t > JANELA_DEDUPE_MS) pagamentosProcessados.delete(k);
  }
  if (pagamentosProcessados.has(id)) return true;
  pagamentosProcessados.set(id, agora);
  return false;
}

/**
 * Extrai os dados do pedido a partir do external_reference do pagamento.
 *
 * Suporta dois formatos:
 *   - JSON estruturado (gerado pela rota /checkout): {"src","phone","ref","total","items"}
 *   - String simples contendo apenas o telefone (fluxo do webhook do WhatsApp)
 *
 * @param {Object} paymentInfo
 * @returns {{phone: string|null, ref: string|null, total: number|null}}
 */
function extrairDadosPedido(paymentInfo) {
  const externalReference = paymentInfo.external_reference;
  const metadata = paymentInfo.metadata || {};

  // Os metadados trazem a lista detalhada de itens, incluindo os sabores
  // escolhidos nos combos. Quando disponível, é a fonte mais rica.
  const itensMeta = Array.isArray(metadata.order_items)
    ? metadata.order_items.map(i => ({
        titulo: i.titulo || i.title || null,
        quantidade: i.quantidade || i.quantity || 1,
        sabores: Array.isArray(i.sabores)
          ? i.sabores.map(s => ({
              titulo: s.titulo || s.title || null,
              quantidade: s.quantidade || s.quantity || 1,
            }))
          : undefined,
      }))
    : null;

  if (externalReference) {
    const valor = String(externalReference).trim();

    // Tenta interpretar como JSON estruturado.
    if (valor.startsWith('{')) {
      try {
        const dados = JSON.parse(valor);
        // Normaliza os itens (podem vir como {id,t,q} ou {id,q}).
        const itensRef = Array.isArray(dados.items)
          ? dados.items.map(i => ({
              titulo: i.t || i.titulo || null,
              quantidade: i.q || i.quantidade || 1,
            }))
          : [];
        return {
          phone: dados.phone || metadata.customer_phone || null,
          ref: dados.ref || null,
          total: typeof dados.total === 'number' ? dados.total : null,
          endereco: dados.addr || metadata.delivery_address || null,
          itens: itensMeta || itensRef,
        };
      } catch (e) {
        console.warn('external_reference não é um JSON válido, usando como telefone.', e.message);
      }
    }

    // Caso contrário, trata como telefone (compatibilidade com fluxo antigo).
    return {
      phone: valor,
      ref: null,
      total: null,
      endereco: metadata.delivery_address || null,
      itens: itensMeta || [],
    };
  }

  return {
    phone: metadata.customer_phone || null,
    ref: null,
    total: null,
    endereco: metadata.delivery_address || null,
    itens: itensMeta || [],
  };
}

/**
 * Monta a mensagem de confirmação enviada ao cliente via WhatsApp.
 */
function montarMensagemConfirmacao({ ref, total, endereco }) {
  let mensagem = '✅ Pagamento aprovado!\nSeu pedido foi confirmado com sucesso. 🥟';
  if (typeof total === 'number') {
    mensagem += `\n\nTotal: R$ ${total.toFixed(2)}`;
  }
  if (endereco) {
    mensagem += `\n📍 Entrega em: ${endereco}`;
  }
  if (ref) {
    mensagem += `\nPedido: ${ref}`;
  }
  mensagem += '\n\nJá estamos preparando! Obrigado pela preferência. ❤️';
  return mensagem;
}

router.post('/webhook/mercadopago', async (req, res) => {
  try {
    // 1) Só nos interessam notificações de PAGAMENTO.
    // O Mercado Pago também envia avisos de outros tipos (ex.: 'merchant_order',
    // 'plan', 'subscription'). Sem este filtro, esses avisos geravam pedidos
    // falsos ("Cliente: não informado").
    const tipo =
      req.body?.type || req.query?.type || req.query?.topic || null;
    if (tipo && tipo !== 'payment') {
      console.log(`Webhook ignorado (tipo: ${tipo})`);
      return res.status(200).send('Ignorado.');
    }

    const paymentId =
      req.body?.data?.id || req.body?.payment_id || req.query?.['data.id'] || req.query?.id;

    if (!paymentId) {
      return res.status(200).send('Sem payment_id.');
    }

    // 2) Evita processar o MESMO pagamento duas vezes (o MP reenvia o webhook).
    if (jaProcessado(paymentId)) {
      console.log(`Pagamento ${paymentId} já processado, ignorando duplicado.`);
      return res.status(200).send('Duplicado.');
    }

    const paymentInfo = await buscarPagamento(paymentId);
    const status = paymentInfo.status;

    console.log(`Pagamento ${paymentId}: ${status}`);

    if (status === 'approved') {
      const { phone, ref, total, itens, endereco } = extrairDadosPedido(paymentInfo);

      // 3) Sem telefone do cliente, este pagamento NÃO veio do nosso fluxo de
      // pedidos (pode ser teste/cobrança avulsa). Não notifica para evitar
      // "NOVO PEDIDO PAGO! Cliente: não informado".
      if (!phone) {
        console.log('Pagamento aprovado sem telefone do cliente — ignorado (não é pedido do bot).');
        return res.status(200).send('OK (sem telefone).');
      }

      // Marca o pagamento como concluído (cancela lembretes pendentes).
      marcarPago(phone);

      // Confirmação para o CLIENTE.
      await enviarMensagemWhatsApp(phone, montarMensagemConfirmacao({ ref, total, endereco }));
      console.log(`Confirmação enviada para ${phone}`);

      // Notificação para o DONO da loja (se ADMIN_PHONE estiver configurado).
      const donoTelefone = process.env.ADMIN_PHONE;
      if (donoTelefone) {
        try {
          await enviarMensagemWhatsApp(
            donoTelefone,
            mensagemNotificacaoDono({
              cliente: phone,
              itens,
              total,
              referencia: ref,
              endereco,
            })
          );
          console.log(`Notificação de pedido enviada ao dono (${donoTelefone})`);
        } catch (e) {
          console.error('Erro ao notificar o dono:', e.message);
        }
      }
    } else {
      // Pagamento ainda não aprovado (pending/rejected): libera o id para que
      // uma futura notificação de aprovação seja processada normalmente.
      pagamentosProcessados.delete(String(paymentId));
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Erro webhook Mercado Pago:', error.message);
    // Libera o id em caso de erro, para que o reenvio do MP seja reprocessado.
    const pid =
      req.body?.data?.id || req.body?.payment_id || req.query?.['data.id'] || req.query?.id;
    if (pid) pagamentosProcessados.delete(String(pid));
    // Responde 200 para evitar reenvios infinitos do Mercado Pago.
    return res.status(200).send('Erro capturado');
  }
});

export default router;
