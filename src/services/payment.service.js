import { preferenceService, paymentService } from '../config/mercadopago.js';

/**
 * Cria uma preferência de pagamento no Mercado Pago de forma genérica.
 *
 * @param {Object} params
 * @param {Array<{title: string, description?: string, quantity: number, unit_price: number, currency_id?: string}>} params.items
 * @param {string} params.externalReference - String para rastrear o pedido no webhook (pode ser JSON).
 * @param {Object} [params.metadata] - Metadados adicionais.
 * @param {string} params.baseUrl - URL base usada para construir as URLs de retorno e notificação.
 * @param {Object} [params.payer] - Dados opcionais do comprador para melhorar a aprovação do pagamento.
 * @returns {Promise<{preferenceId: string, initPoint: string, sandboxInitPoint: string}>}
 */
export async function criarPreferencia({ items, externalReference, metadata = {}, baseUrl, payer }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('É necessário informar ao menos um item para criar a preferência.');
  }

  if (!baseUrl) {
    throw new Error('baseUrl não configurada (variável de ambiente BASE_URL).');
  }

  // Define o identificador da fatura do cartão (máximo 13 caracteres)
  const statementDescriptor = (process.env.MP_STATEMENT_DESCRIPTOR || 'LAEMPANADAS')
    .slice(0, 13)
    .toUpperCase();

  const body = {
    items: items.map((item) => ({
      title: item.title,
      description: item.description || item.title,
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
    // Correção: Adiciona o identificador que aparece na fatura do cartão
    statement_descriptor: statementDescriptor,
  };

  if (payer) {
    body.payer = {
      email: payer.email,
      ...(payer.name && { name: payer.name }),
      ...(payer.surname && { surname: payer.surname }),
      ...(payer.phone && { phone: payer.phone }),
      ...(payer.identification && { identification: payer.identification }),
    };
  }

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
        description: `Pagamento simplificado referente ao pedido originado no WhatsApp ${customerPhone}`,
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