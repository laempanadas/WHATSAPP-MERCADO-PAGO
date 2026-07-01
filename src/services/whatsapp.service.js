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

/**
 * Envia uma mensagem interativa com um BOTÃO de URL (Call To Action).
 *
 * Diferente de mandar o link no texto (que vira só uma prévia clicável),
 * o botão CTA abre o link diretamente ao ser tocado — ideal para o link de
 * pagamento do Mercado Pago.
 *
 * Requer que o cliente tenha enviado uma mensagem nas últimas 24h
 * (janela de atendimento), o que é sempre o caso no fluxo do checkout.
 *
 * @param {string} telefone
 * @param {Object} opcoes
 * @param {string} opcoes.corpo - Texto principal da mensagem.
 * @param {string} opcoes.textoBotao - Texto exibido no botão (máx. 20 caracteres).
 * @param {string} opcoes.url - URL que o botão abre.
 * @param {string} [opcoes.rodape] - Texto pequeno opcional no rodapé.
 */
export async function enviarBotaoUrlWhatsApp(telefone, { corpo, textoBotao, url, rodape }) {
  const interactive = {
    type: 'button',
    body: { text: corpo },
    action: {
      buttons: [
        {
          type: 'url',
          title: String(textoBotao).slice(0, 20),
          url,
        },
      ],
    },
  };

  if (rodape) {
    interactive.footer = { text: rodape };
  }

  const response = await fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: telefone,
      type: 'interactive',
      interactive,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Faz fallback para mensagem de texto simples caso o botão falhe
    // (ex.: número de teste sem suporte a interativo).
    console.warn('Botão CTA falhou, enviando link como texto:', JSON.stringify(data));
    return enviarMensagemWhatsApp(telefone, `${corpo}\n\n${url}`);
  }

  return data;
}