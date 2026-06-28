import { Router } from 'express';
import { buscarPagamento } from '../services/payment.service.js';
import { enviarMensagemWhatsApp } from '../services/whatsapp.service.js';
import { mensagemNotificacaoDono } from '../services/messages.service.js';
import { marcarPago } from '../services/lembrete.service.js';

const router = Router();

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
    const paymentId =
      req.body?.data?.id || req.body?.payment_id || req.query?.['data.id'];

    if (!paymentId) {
      return res.status(200).send('Sem payment_id.');
    }

    const paymentInfo = await buscarPagamento(paymentId);
    const status = paymentInfo.status;

    console.log(`Pagamento ${paymentId}: ${status}`);

    if (status === 'approved') {
      const { phone, ref, total, itens, endereco } = extrairDadosPedido(paymentInfo);

      // 0) Marca o pagamento como concluído (cancela lembretes pendentes).
      if (phone) {
        marcarPago(phone);
      }

      // 1) Confirmação para o CLIENTE.
      if (phone) {
        await enviarMensagemWhatsApp(phone, montarMensagemConfirmacao({ ref, total, endereco }));
        console.log(`Confirmação enviada para ${phone}`);
      } else {
        console.log('Telefone não encontrado em external_reference nem metadata');
      }

      // 2) Notificação para o DONO da loja (se ADMIN_PHONE estiver configurado).
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
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Erro webhook Mercado Pago:', error.message);
    // Responde 200 para evitar reenvios infinitos do Mercado Pago.
    return res.status(200).send('Erro capturado');
  }
});

export default router;
