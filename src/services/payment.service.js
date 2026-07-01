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
 * @param {string} params.payer.email - E-mail do pagador.
 * @param {string} [params.payer.name] - Nome do pagador.
 * @param {string} [params.payer.surname] - Sobrenome do pagador.
 * @param {Object} [params.payer.phone] - Telefone do pagador (area_code, number).
 * @param {Object} [params.payer.identification] - Documento do pagador (type, number).
 * @returns {Promise<{preferenceId: string, initPoint: string, sandboxInitPoint: string}>}
 */
export async function criarPreferencia({ items, externalReference, metadata = {}, baseUrl, payer }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('É necessário informar ao menos um item para criar a preferência.');
  }

  if (!baseUrl) {
    throw new Error('baseUrl não configurada (variável de ambiente BASE_URL).');
  }

  const body = {
    items: items.map((item) => ({
      title: item.title,
      // Correção: Adiciona o campo description com fallback para o title caso venha vazio
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
  };

  // Melhoria de segurança antifraude: Se o pagador for informado pelo controller, anexa ao payload
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
        // Fornece uma descrição para o fluxo legado, cumprindo as recomendações de qualidade
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