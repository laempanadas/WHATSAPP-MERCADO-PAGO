import { Router } from 'express';
import {
  extrairPedidoDoPayload,
  extrairTextoDoPayload,
} from '../services/order.service.js';
import { criarPreferenciaPagamento } from '../services/payment.service.js';
import {
  enviarMensagemWhatsApp,
  enviarBotaoUrlWhatsApp,
} from '../services/whatsapp.service.js';
import { processarMensagemTexto } from '../services/chatbot.service.js';

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
  // Responde 200 imediatamente para a Meta não reenviar o webhook.
  // O processamento e o envio da resposta acontecem em seguida.
  res.status(200).send('EVENT_RECEIVED');

  try {
    // 1) Pedido via CATÁLOGO (botão "Comprar" / order do WhatsApp).
    const pedido = extrairPedidoDoPayload(req.body);

    if (pedido && pedido.type === 'order') {
      const { customerPhone, totalAmount } = pedido;

      const { initPoint, sandboxInitPoint } = await criarPreferenciaPagamento({
        totalAmount,
        customerPhone,
        baseUrl: process.env.BASE_URL,
      });

      const link = initPoint || sandboxInitPoint;

      await enviarMensagemWhatsApp(
        customerPhone,
        `✅ Pedido recebido!\n\nTotal: R$ ${totalAmount.toFixed(2)}\n\n💳 Pague aqui:\n${link}`
      );
      return;
    }

    // 2) Mensagem de TEXTO (conversa com o bot).
    const textoMsg = extrairTextoDoPayload(req.body);

    if (textoMsg) {
      const { customerPhone, texto, nomePerfil } = textoMsg;
      const resposta = await processarMensagemTexto(customerPhone, texto, nomePerfil);

      // A resposta pode ser texto simples ou um botão de URL (pagamento).
      if (resposta?.tipo === 'botao_url') {
        await enviarBotaoUrlWhatsApp(customerPhone, {
          corpo: resposta.corpo,
          textoBotao: resposta.textoBotao,
          url: resposta.url,
          rodape: resposta.rodape,
        });
      } else {
        await enviarMensagemWhatsApp(customerPhone, resposta.texto);
      }
      return;
    }

    // 3) Outros eventos (status de entrega, etc.) — ignorados.
    const eventType =
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.type ||
      req.body?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.status ||
      'desconhecido';
    console.log('Webhook WhatsApp: evento sem mensagem processável.', { eventType });
  } catch (error) {
    console.error('Erro webhook WhatsApp:', error.message);
  }
});

export default router;