import { Router } from 'express';
import {
  interpretarCheckout,
  montarExternalReference,
} from '../services/checkout.service.js';
import { criarPreferencia } from '../services/payment.service.js';

const router = Router();

/**
 * GET /checkout
 *
 * Endpoint usado pelo Meta Commerce Manager como URL de finalização da compra.
 * Recebe os parâmetros do produto, interpreta o pedido, cria a preferência no
 * Mercado Pago e redireciona para o checkout de produção.
 *
 * Query opcional:
 * - ?debug=1 -> retorna JSON em vez de redirecionar
 */
router.get('/checkout', async (req, res, next) => {
  try {
    const query = req.query || {};

    console.log('GET /checkout recebido');
    console.log('QUERY BRUTA:', query);

    const parsed = interpretarCheckout(query);
    const { items, totalAmount, coupon, orderRef, customerPhone } = parsed;

    console.log('ITEMS INTERPRETADOS:', items);
    console.log('TOTAL INTERPRETADO:', totalAmount);
    console.log('CUPOM:', coupon);
    console.log('ORDER REF:', orderRef);
    console.log('PHONE:', customerPhone);

    if (!Array.isArray(items) || items.length === 0) {
      console.warn('Checkout sem produtos identificáveis nos parâmetros.', query);
      return res.status(400).json({
        erro: 'Nenhum produto informado. Verifique os parâmetros da URL de checkout.',
      });
    }

    if (!(totalAmount > 0)) {
      console.warn('Checkout com total inválido.', { totalAmount, items });
      return res.status(400).json({
        erro: 'Total do pedido inválido.',
      });
    }

    const externalReference = montarExternalReference({
      customerPhone,
      orderRef,
      items,
      totalAmount,
    });

    console.log('EXTERNAL REFERENCE:', externalReference);

    const metadata = {
      source: 'meta_checkout',
      customer_phone: customerPhone || null,
      order_reference: orderRef || null,
      coupon: coupon || null,
      items: items.map((i) => ({
        retailer_id: i.retailer_id,
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    };

    console.log('METADATA:', metadata);

    const { preferenceId, initPoint } = await criarPreferencia({
      items,
      externalReference,
      metadata,
      baseUrl: process.env.BASE_URL,
    });

    console.log('PREFERENCE ID:', preferenceId);
    console.log('INIT POINT:', initPoint);

    if (!initPoint) {
      throw new Error(
        'Mercado Pago não retornou init_point de produção. Verifique se o MP_ACCESS_TOKEN é de produção e se a conta está correta.'
      );
    }

    console.log(
      `Preferência criada com sucesso | total: R$ ${totalAmount.toFixed(2)} | itens: ${items.length}`
    );

    if (query.debug === '1') {
      return res.status(200).json({
        preference_id: preferenceId,
        total: totalAmount,
        coupon,
        order_reference: orderRef,
        customer_phone: customerPhone,
        items,
        external_reference: externalReference,
        checkout_url: initPoint,
      });
    }

    return res.redirect(302, initPoint);
  } catch (error) {
    console.error('Erro em GET /checkout:', error);
    return next(error);
  }
});

export default router;
