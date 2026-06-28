import { preferenceService, paymentService } from '../config/mercadopago.js';

/**
 * Cria uma preferência de pagamento no Mercado Pago de forma genérica.
 *
 * @param {Object} params
 * @param {Array<{title: string, quantity: number, unit_price: number, currency_id?: string}>} params.items
 * @param {string} params.externalReference - String para rastrear o pedido no webhook (pode ser JSON).
 * @param {Object} [params.metadata] - Metadados adicionais.
 * @param {string} params.baseUrl - URL base usada para construir as URLs de retorno e notificação.
 * @returns {Promise<{preferenceId: string, initPoint: string, sandboxInitPoint: string}>}
 */
export async function criarPreferencia({ items, externalReference, metadata = {}, baseUrl }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('É necessário informar ao menos um item para criar a preferência.');
  }

  if (!baseUrl) {
    throw new Error('baseUrl não configurada (variável de ambiente BASE_URL).');
  }

  const body = {
    items: items.map((item) => ({
      title: item.title,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      currency_id: item.currency_id || 'BRL',
    })),
    external_reference: externalReference,
    metadata,
    notification_url: `${baseUrl}/webhook/mercadopago`,
    back_urls: {
      success: `${baseUrl}/pagamento/sucesso`,
      failure: `${baseUrl}/pagamento/erro`,
      pending: `${baseUrl}/pagamento/pendente`,
    },
    auto_return: 'approved',
    payment_methods: {
      excluded_payment_types: [{ id: 'ticket' }],
    },
  };

  const response = await preferenceService.create({ body });

  return {
    preferenceId: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point,
  };
}

/**
 * Mantida por compatibilidade com o fluxo do webhook do WhatsApp.
 * Cria uma preferência simples a partir do valor total e do telefone do cliente.
 */
export async function criarPreferenciaPagamento({ totalAmount, customerPhone, baseUrl }) {
  return criarPreferencia({
    items: [
      {
        title: `Pedido WhatsApp - ${customerPhone}`,
        quantity: 1,
        unit_price: totalAmount,
        currency_id: 'BRL',
      },
    ],
    externalReference: customerPhone,
    metadata: { customer_phone: customerPhone },
    baseUrl,
  });
}

export async function buscarPagamento(paymentId) {
  return await paymentService.get({ id: paymentId });
}
