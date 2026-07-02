import { Router } from 'express';
import { buscarPagamento } from '../services/payment.service.js';
import { enviarMensagemWhatsApp } from '../services/whatsapp.service.js';
import { mensagemNotificacaoDono } from '../services/messages.service.js';
import { marcarPago } from '../services/lembrete.service.js';

const router = Router();

/**
 * Memória dos pagamentos já processados (evita notificação duplicada).
 */
const pagamentosProcessados = new Map();
const JANELA_DEDUPE_MS = 6 * 60 * 60 * 1000; // 6 horas

function jaProcessado(paymentId) {
  const id = String(paymentId);
  const agora = Date.now();
  for (const [k, t] of pagamentosProcessados.entries()) {
    if (agora - t > JANELA_DEDUPE_MS) pagamentosProcessados.delete(k);
  }
  if (pagamentosProcessados.has(id)) return true;
  pagamentosProcessados.set(id, agora);
  return false;
}

/**
 * Extrai os dados do pedido a partir do external_reference do pagamento.
 */
function extrairDadosPedido(paymentInfo) {
  const externalReference = paymentInfo.external_reference;
  const metadata = paymentInfo.metadata || {};

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

    if (valor.startsWith('{')) {
      try {
        const dados = JSON.parse(valor);
        const itensRef = Array.isArray(dados.items)
          ? dados.items.map(i => ({
              titulo: i.t || i.titulo || null,
              quantidade: i.q || i.quantidade || 1,
            }))
          : [];
        return {
          phone: dados.phone || metadata.customer_phone || null,
          nome: dados.nome || metadata.customer_name || null,
          ref: dados.ref || null,
          total: typeof dados.total === 'number' ? dados.total : null,
          endereco: dados.addr || metadata.delivery_address || null,
          itens: itensMeta || itensRef,
        };
      } catch (e) {
        console.warn('external_reference não é um JSON válido, usando como telefone.', e.message);
      }
    }

    return {
      phone: valor,
      nome: metadata.customer_name || null,
      ref: null,
      total: null,
      endereco: metadata.delivery_address || null,
      itens: itensMeta || [],
    };
  }

  return {
    phone: metadata.customer_phone || null,
    nome: metadata.customer_name || null,
    ref: null,
    total: null,
    endereco: metadata.delivery_address || null,
    itens: itensMeta || [],
  };
}

/**
 * Monta a mensagem de confirmação enviada ao cliente via WhatsApp.
 */
function montarMensagemConfirmacao({ nome, ref, total, endereco }) {
  const saudacao = nome ? `✅ ${nome}, pagamento aprovado!` : '✅ Pagamento aprovado!';
  let mensagem = `${saudacao}\nSeu pedido foi confirmado com sucesso. 🥟`;
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
    const tipo = req.body?.type || req.query?.type || req.query?.topic || null;
    if (tipo && tipo !== 'payment') {
      console.log(`Webhook ignorado (tipo: ${tipo})`);
      return res.status(200).send('Ignorado.');
    }

    const paymentId =
      req.body?.data?.id || req.body?.payment_id || req.query?.['data.id'] || req.query?.id;

    if (!paymentId) {
      return res.status(200).send('Sem payment_id.');
    }

    // 2) Evita processar o MESMO pagamento duas vezes.
    if (jaProcessado(paymentId)) {
      console.log(`Pagamento ${paymentId} já processado, ignorando duplicado.`);
      return res.status(200).send('Duplicado.');
    }

    // ==========================================
    // MUDANÇA CHAVE: RESPOSTA IMEDIATA
    // ==========================================
    // Respondemos imediatamente para o Mercado Pago com HTTP 200 OK.
    // Isso evita o erro de TIMEOUT e sinaliza recepção com sucesso.
    res.status(200).send('Processando em segundo plano.');

    // Executamos a lógica pesada (buscar pagamento e notificar) de forma assíncrona
    // em segundo plano (background job), sem travar a resposta da requisição.
    (async () => {
      try {
        const paymentInfo = await buscarPagamento(paymentId);
        const status = paymentInfo.status;

        console.log(`[Segundo Plano] Pagamento ${paymentId}: ${status}`);

        if (status === 'approved') {
          const { phone, nome, ref, total, itens, endereco } = extrairDadosPedido(paymentInfo);

          if (!phone) {
            console.log('[Segundo Plano] Pagamento aprovado sem telefone do cliente — ignorado.');
            return;
          }

          // Marca o pagamento como concluído (cancela lembretes pendentes).
          marcarPago(phone);

          // Confirmação para o CLIENTE.
          await enviarMensagemWhatsApp(phone, montarMensagemConfirmacao({ nome, ref, total, endereco }));
          console.log(`[Segundo Plano] Confirmação enviada para ${phone}`);

          // Notificação para o DONO da loja (se ADMIN_PHONE estiver configurado).
          const donoTelefone = process.env.ADMIN_PHONE;
          if (donoTelefone) {
            try {
              await enviarMensagemWhatsApp(
                donoTelefone,
                mensagemNotificacaoDono({
                  cliente: phone,
                  nome,
                  itens,
                  total,
                  referencia: ref,
                  endereco,
                })
              );
              console.log(`[Segundo Plano] Notificação de pedido enviada ao dono (${donoTelefone})`);
            } catch (e) {
              console.error('[Segundo Plano] Erro ao notificar o dono:', e.message);
            }
          }
        } else {
          // Pagamento ainda não aprovado: libera para que notificações futuras de aprovação funcionem.
          pagamentosProcessados.delete(String(paymentId));
        }
      } catch (backgroundError) {
        console.error('[Segundo Plano] Erro ao processar dados do webhook:', backgroundError.message);
        // Libera em caso de falha de processamento para permitir nova tentativa pelo reenvio do MP.
        pagamentosProcessados.delete(String(paymentId));
      }
    })();

  } catch (error) {
    // Tratamento de segurança caso o bloco principal sofra alguma falha inesperada
    console.error('Erro geral na rota de webhook:', error.message);
    return res.status(200).send('Erro tratado.');
  }
});

export default router;