import { Router } from 'express';
import { buscarPagamento } from '../services/payment.service.js';
import { enviarMensagemWhatsApp } from '../services/whatsapp.service.js';

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

  if (externalReference) {
    const valor = String(externalReference).trim();

    // Tenta interpretar como JSON estruturado.
    if (valor.startsWith('{')) {
      try {
        const dados = JSON.parse(valor);
        return {
          phone: dados.phone || metadata.customer_phone || null,
          ref: dados.ref || null,
          total: typeof dados.total === 'number' ? dados.total : null,
        };
      } catch (e) {
        console.warn('external_reference não é um JSON válido, usando como telefone.', e.message);
      }
    }

    // Caso contrário, trata como telefone (compatibilidade com fluxo antigo).
    return { phone: valor, ref: null, total: null };
  }

  return {
    phone: metadata.customer_phone || null,
    ref: null,
    total: null,
  };
}

/**
 * Monta a mensagem de confirmação enviada ao cliente via WhatsApp.
 */
function montarMensagemConfirmacao({ ref, total }) {
  let mensagem = '✅ Pagamento aprovado!\nSeu pedido foi confirmado com sucesso.';
  if (typeof total === 'number') {
    mensagem += `\n\nTotal: R$ ${total.toFixed(2)}`;
  }
  if (ref) {
    mensagem += `\nPedido: ${ref}`;
  }
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
      const { phone, ref, total } = extrairDadosPedido(paymentInfo);

      if (phone) {
        await enviarMensagemWhatsApp(phone, montarMensagemConfirmacao({ ref, total }));
        console.log(`Confirmação enviada para ${phone}`);
      } else {
        console.log('Telefone não encontrado em external_reference nem metadata');
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
