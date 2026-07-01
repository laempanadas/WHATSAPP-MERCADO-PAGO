import { calcularTotal } from '../utils/money.js';

export function extrairPedidoDoPayload(body) {
  const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) {
    return null;
  }

  const customerPhone = message.from;
  const orderData = message.order || message.interactive?.order;
  const productItems = Array.isArray(orderData?.product_items)
    ? orderData.product_items
    : [];

  if (productItems.length === 0) {
    return {
      type: 'not_order',
      customerPhone,
      rawMessage: message
    };
  }

  const totalAmount = calcularTotal(
    productItems.map(item => ({
      quantity: item.quantity || item.item_quantity || 0,
      unit_price: item.item_price || item.unit_price || item.price || 0,
    }))
  );

  return {
    type: 'order',
    customerPhone,
    orderData,
    totalAmount,
    items: productItems,
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
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];

  if (!message) {
    return null;
  }

  const customerPhone = message.from;

  // Nome do perfil do WhatsApp (quando disponível). A Meta envia em "contacts".
  const nomePerfil = value?.contacts?.[0]?.profile?.name || null;

  // Mensagem de texto comum.
  if (message.type === 'text' && message.text?.body) {
    return { customerPhone, texto: message.text.body, nomePerfil };
  }

  // Resposta de botão interativo (texto do botão).
  if (message.type === 'interactive') {
    const titulo =
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title;
    if (titulo) {
      return { customerPhone, texto: titulo, nomePerfil };
    }
  }

  return null;
}