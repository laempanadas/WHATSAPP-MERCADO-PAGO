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