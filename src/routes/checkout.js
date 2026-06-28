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
 * Ponto de extremidade configurado como "URL de finalização da compra" no
 * Meta Commerce Manager. A Meta redireciona o cliente para cá com os
 * parâmetros do produto (product_id, quantity, external_id, item_id, etc.).
 *
 * Fluxo:
 *   1. Interpreta os parâmetros enviados pela Meta.
 *   2. Resolve os produtos (catálogo mock) e calcula o total.
 *   3. Cria uma preferência de pagamento no Mercado Pago.
 *   4. Redireciona o cliente para o checkout do Mercado Pago.
 *
 * Query opcional `?debug=1` retorna um JSON com os detalhes em vez de
 * redirecionar (útil para testes).
 */
router.get('/checkout', async (req, res, next) => {
  try {
    console.log('GET /checkout recebido', req.query);

    const { items, totalAmount, coupon, orderRef, customerPhone } = interpretarCheckout(
      req.query
    );

    // Validação: precisa de ao menos um item com valor positivo.
    if (!items.length) {
      console.warn('Checkout sem produtos identificáveis nos parâmetros.', req.query);
      return res.status(400).json({
        erro: 'Nenhum produto informado. Verifique os parâmetros da URL de checkout.',
      });
    }

    if (!(totalAmount > 0)) {
      console.warn('Checkout com total inválido.', { totalAmount, items });
      return res.status(400).json({ erro: 'Total do pedido inválido.' });
    }

    const externalReference = montarExternalReference({
      customerPhone,
      orderRef,
      items,
      totalAmount,
    });

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

    const { preferenceId, initPoint, sandboxInitPoint } = await criarPreferencia({
      items,
      externalReference,
      metadata,
      baseUrl: process.env.BASE_URL,
    });

    const checkoutUrl = initPoint || sandboxInitPoint;

    if (!checkoutUrl) {
      throw new Error('Mercado Pago não retornou uma URL de checkout.');
    }

    console.log(
      `Preferência criada: ${preferenceId} | total: R$ ${totalAmount.toFixed(2)} | itens: ${items.length}`
    );

    // Modo debug: retorna JSON em vez de redirecionar.
    if (req.query.debug === '1') {
      return res.status(200).json({
        preference_id: preferenceId,
        total: totalAmount,
        coupon,
        order_reference: orderRef,
        customer_phone: customerPhone,
        items,
        checkout_url: checkoutUrl,
      });
    }

    // Redireciona o cliente para o checkout do Mercado Pago.
    return res.redirect(302, checkoutUrl);
  } catch (error) {
    return next(error);
  }
});

export default router;
