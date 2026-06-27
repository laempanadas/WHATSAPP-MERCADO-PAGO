import { preferenceService, paymentService } from '../config/mercadopago.js';

export async function criarPreferenciaPagamento({ totalAmount, customerPhone, baseUrl }) {
  const response = await preferenceService.create({
    body: {
      items: [
        {
          title: `Pedido WhatsApp - ${customerPhone}`,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: 'BRL'
        }
      ],
      external_reference: customerPhone,
      metadata: {
        customer_phone: customerPhone
      },
      notification_url: `${baseUrl}/webhook/mercadopago`,
      back_urls: {
        success: `${baseUrl}/pagamento/sucesso`,
        failure: `${baseUrl}/pagamento/erro`,
        pending: `${baseUrl}/pagamento/pendente`
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' }
        ]
      }
    }
  });

  return {
    preferenceId: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point
  };
}

export async function buscarPagamento(paymentId) {
  return await paymentService.get({ id: paymentId });
}