import { Router } from 'express';
import { buscarPagamento } from '../services/payment.service.js';
import { enviarMensagemWhatsApp } from '../services/whatsapp.service.js';

const router = Router();

router.post('/webhook/mercadopago', async (req, res) => {
  try {
    const paymentId =
      req.body?.data?.id ||
      req.body?.payment_id ||
      req.query?.['data.id'];

    if (!paymentId) {
      return res.status(200).send('Sem payment_id.');
    }

    const paymentInfo = await buscarPagamento(paymentId);
    const status = paymentInfo.status;

    console.log(`Pagamento ${paymentId}: ${status}`);

    if (status === 'approved') {
      const telefone =
        paymentInfo.external_reference ||
        paymentInfo.metadata?.customer_phone;

      if (telefone) {
        await enviarMensagemWhatsApp(
          telefone,
          '✅ Pagamento aprovado!\nSeu pedido foi confirmado com sucesso.'
        );
      } else {
        console.log('Telefone não encontrado em external_reference nem metadata');
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Erro webhook Mercado Pago:', error.message);
    return res.status(200).send('Erro capturado');
  }
});

export default router;