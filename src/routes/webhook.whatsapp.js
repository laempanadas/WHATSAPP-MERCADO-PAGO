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

// --- EDITADO: Função de máscara para privacidade (LGPD) ---
// Por que: Protege o número do cliente de ficar exposto nos logs do Cloud Run.
const mask = (phone) => phone ? `${String(phone).slice(0, 4)}****${String(phone).slice(-4)}` : 'n/a';

/**
 * Validação do Webhook (GET)
 * O VERIFY_TOKEN agora vem do Secret Manager de forma segura.
 */
router.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook WhatsApp validado com sucesso.');
    return res.status(200).send(challenge);
  }

  // EDITADO: Log de erro sem expor o token esperado
  console.error('❌ Falha na validação: Token de verificação assíncrono não confere.');
  return res.status(403).send('Proibido');
});

/**
 * Recebimento de Mensagens (POST)
 */
router.post('/webhook/whatsapp', async (req, res) => {
  // Responde 200 imediatamente para evitar reenvios da Meta por timeout.
  res.status(200).send('EVENT_RECEIVED');

  try {
    // 1) CORRIGIDO: Pedido via CATÁLOGO (Fluxo Nativo)
    // Por que: Antes enviava apenas texto. Agora envia um BOTÃO igual ao do chatbot,
    // o que garante que o link seja clicável mesmo se o cliente não tiver seu contato salvo.
    const pedido = extrairPedidoDoPayload(req.body);

    if (pedido && pedido.type === 'order') {
      const { customerPhone, totalAmount } = pedido;

      console.log(`[Catálogo] Novo pedido de ${mask(customerPhone)} - Total: R$ ${totalAmount.toFixed(2)}`);

      const { initPoint, sandboxInitPoint } = await criarPreferenciaPagamento({
        totalAmount,
        customerPhone,
        baseUrl: process.env.BASE_URL,
      });

      const link = initPoint || sandboxInitPoint;

      // EDITADO: Alterado de enviarMensagemWhatsApp para enviarBotaoUrlWhatsApp
      await enviarBotaoUrlWhatsApp(customerPhone, {
        corpo: `✅ *Pedido Recebido!*\n\nObrigado por escolher nossa loja. O valor total é *R$ ${totalAmount.toFixed(2)}*.\n\nClique no botão abaixo para concluir seu pagamento com segurança via Mercado Pago.`,
        textoBotao: 'Pagar Agora 💳',
        url: link,
        rodape: 'whatsappmercadopago'
      });
      
      console.log(`[Catálogo] Botão de pagamento enviado para ${mask(customerPhone)}`);
      return;
    }

    // 2) Mensagem de TEXTO (Fluxo Conversacional)
    const textoMsg = extrairTextoDoPayload(req.body);

    if (textoMsg) {
      const { customerPhone, texto, nomePerfil } = textoMsg;
      
      // EDITADO: Log com máscara e limite de caracteres para manter o console limpo
      console.log(`[Chatbot] Mensagem de ${mask(customerPhone)}: "${texto.substring(0, 25)}..."`);
      
      const resposta = await processarMensagemTexto(customerPhone, texto, nomePerfil);

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

    // 3) EDITADO: Filtro de ruído nos logs
    // Por que: O WhatsApp envia muitos eventos de status (read, delivered). 
    // Silenciamos esses logs para focar no que importa e reduzir custos de logging.
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const eventType = value?.messages?.[0]?.type || value?.statuses?.[0]?.status || 'desconhecido';
    
    const eventosIgnorados = ['read', 'delivered', 'sent'];
    if (!eventosIgnorados.includes(eventType)) {
      console.log(`[Info] Evento recebido e ignorado: ${eventType}`);
    }

  } catch (error) {
    // EDITADO: Log de erro simplificado e direto
    console.error(`❌ Erro no Webhook WhatsApp: ${error.message}`);
  }
});

export default router;
