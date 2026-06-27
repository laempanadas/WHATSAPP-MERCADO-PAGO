import { Router } from 'express';
import { extrairPedidoDoPayload } from '../services/order.service.js';
import { criarPreferenciaPagamento } from '../services/payment.service.js';
import { enviarMensagemWhatsApp } from '../services/whatsapp.service.js';

const router = Router();

router.get('/webhook/whatsapp', (req, res) => {
  console.log('GET /webhook/whatsapp recebido', req.query);

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook validado com sucesso');
    return res.status(200).send(challenge);
  }

  console.log('Falha na validação', {
    mode,
    token,
    expected: process.env.VERIFY_TOKEN
  });

  return res.status(403).send('Proibido');
});

router.post('/webhook/whatsapp', async (req, res) => {
  try {
    const parsed = extrairPedidoDoPayload(req.body);

    if (!parsed) {
      return res.status(200).send('Sem mensagem para processar.');
    }

    if (parsed.type !== 'order') {
      return res.status(200).send('Mensagem recebida, mas não é um pedido.');
    }

    const { customerPhone, totalAmount } = parsed;

    const { initPoint, sandboxInitPoint, preferenceId } = await criarPreferenciaPagamento({
      totalAmount,
      customerPhone,
      baseUrl: process.env.BASE_URL
    });

    const link = sandboxInitPoint || initPoint;

    await enviarMensagemWhatsApp(
      customerPhone,
      `✅ Pedido recebido!\n\nTotal: R$ ${totalAmount.toFixed(2)}\n\n💳 Pague aqui:\n${link}`
    );

    return res.status(200).json({
      status: 'sucesso',
      preference_id: preferenceId,
      checkout_link: link
    });
  } catch (error) {
    console.error('Erro webhook WhatsApp:', error.message);
    return res.status(500).json({
      erro: error.message
    });
  }
});

export default router;