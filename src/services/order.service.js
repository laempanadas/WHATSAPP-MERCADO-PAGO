import { calcularTotal } from '../utils/money.js';

export function extrairPedidoDoPayload(body) {
  const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) {
    return null;
  }

  const customerPhone = message.from;
  const orderData = message.order || message.interactive?.order;

  if (!orderData || !Array.isArray(orderData.product_items)) {
    return {
      type: 'not_order',
      customerPhone,
      rawMessage: message
    };
  }

  const totalAmount = calcularTotal(
    orderData.product_items.map(item => ({
      quantity: item.quantity,
      unit_price: item.item_price
    }))
  );

  return {
    type: 'order',
    customerPhone,
    orderData,
    totalAmount
  };
}

/**
 * Extrai uma mensagem de TEXTO do payload do WhatsApp.
 *
 * Retorna null quando o payload não contém uma mensagem de texto
 * (ex.: é um pedido de catálogo, status de entrega, etc.).
 *
 * @param {object} body - corpo recebido no webhook
 * @returns {{customerPhone: string, texto: string}|null}
 */
export function extrairTextoDoPayload(body) {
  const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) {
    return null;
  }

  const customerPhone = message.from;

  // Mensagem de texto comum.
  if (message.type === 'text' && message.text?.body) {
    return { customerPhone, texto: message.text.body };
  }

  // Resposta de botão interativo (texto do botão).
  if (message.type === 'interactive') {
    const titulo =
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title;
    if (titulo) {
      return { customerPhone, texto: titulo };
    }
  }

  return null;
}