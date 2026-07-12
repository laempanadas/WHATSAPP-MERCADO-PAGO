import { Router } from 'express';
import {
  interpretarCheckout,
  montarExternalReference,
} from '../services/checkout.service.js';
import { criarPreferencia } from '../services/payment.service.js';

const router = Router();

// Domínios permitidos para garantir pagamento seguro (Segurança de Open Redirect)
const DOMINIOS_MERCADO_PAGO_PERMITIDOS = [
  'mercadopago.com',
  'mercadopago.com.br',
  'mercadopago.com.ar'
];

/**
 * Valida se uma URL pertence a um domínio seguro do Mercado Pago
 * @param {string} urlString 
 * @returns {boolean}
 */
function IsUrlSeguraMercadoPago(urlString) {
  try {
    const url = new URL(urlString);
    return DOMINIOS_MERCADO_PAGO_PERMITIDOS.some(dominio => 
      url.hostname === dominio || url.hostname.endsWith('.' + dominio)
    );
  } catch (e) {
    return false;
  }
}

/**
 * GET /checkout
 * Processa com segurança os pedidos originados do catálogo da Meta
 */
router.get('/checkout', async (req, res, next) => {
  const query = req.query || {};
  
  // Log estruturado em um único objeto para facilitar a leitura no Cloud Run
  console.log('Iniciando processamento de Checkout', { 
    origem: 'meta_commerce',
    query_bruta: query 
  });

  try {
    // 1. Interpretação dos parâmetros enviados pela Meta
    const parsed = interpretarCheckout(query);
    const { items, totalAmount, coupon, orderRef, customerPhone } = parsed;

    // 2. Validações de Consistência
    if (!Array.isArray(items) || items.length === 0) {
      console.warn('[Checkout] Tentativa de checkout sem produtos.', { query });
      return res.status(400).json({
        erro: 'Checkout inválido: Nenhum produto identificável foi encontrado.',
      });
    }

    if (totalAmount <= 0) {
      console.warn('[Checkout] Tentativa de compra com valor inválido.', { totalAmount, items });
      return res.status(400).json({
        erro: 'Checkout inválido: O valor total do pedido precisa ser maior que zero.',
      });
    }

    // 3. Geração de referências de rastreamento seguras
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
      items: items.map((item) => ({
        retailer_id: item.retailer_id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };

    // 4. Criação da preferência na API do Mercado Pago
    const { preferenceId, initPoint } = await criarPreferencia({
      items,
      externalReference,
      metadata,
      baseUrl: process.env.BASE_URL,
    });

    // 5. Verificação de resposta do gateway de pagamento
    if (!initPoint) {
      throw new Error('O Mercado Pago não retornou uma URL de inicialização (init_point).');
    }

    // 6. Segurança: Garante que o redirecionamento é para o site legítimo do Mercado Pago
    if (!IsUrlSeguraMercadoPago(initPoint)) {
      console.error('[Segurança] URL de checkout rejeitada por não pertencer ao Mercado Pago:', initPoint);
      return res.status(400).json({
        erro: 'Erro de segurança: A URL de destino do checkout não é confiável.',
      });
    }

    console.log('[Checkout] Preferência de pagamento criada com sucesso', {
      preference_id: preferenceId,
      total: totalAmount,
      total_itens: items.length
    });

    // 7. Modo Debug ou Redirecionamento Final Seguro
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

    // Código HTTP 302: Redirecionamento temporário para o ambiente seguro do Mercado Pago
    return res.redirect(302, initPoint);

  } catch (error) {
    console.error('Falha crítica no processamento do GET /checkout:', error);
    return next(error);
  }
});

export default router;
