import { PHONE_NUMBER_ID, WA_TOKEN } from '../config/whatsapp.js';

export async function enviarMensagemWhatsApp(telefone, mensagem) {
  const response = await fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: telefone,
      type: 'text',
      text: {
        body: mensagem
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Erro WhatsApp: ${JSON.stringify(data)}`);
  }

  return data;
}