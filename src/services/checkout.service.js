import { buscarProduto, PRECO_PADRAO } from '../data/products.js';
import { calcularTotal } from '../utils/money.js';

const QUANTIDADE_MAXIMA_POR_ITEM = 100;

/**
 * Normaliza/valida uma quantidade recebida via query string.
 * Retorna um inteiro >= 1 e <= QUANTIDADE_MAXIMA_POR_ITEM.
 */
function normalizarQuantidade(valor) {
  const qty = Number.parseInt(valor, 10);
  if (!Number.isFinite(qty) || qty < 1) {
    return 1;
  }
  return Math.min(qty, QUANTIDADE_MAXIMA_POR_ITEM);
}

/**
 * Resolve um item de pedido a partir de um identificador de produto e quantidade.
 * Usa o catálogo mock; caso o produto não seja encontrado, aplica um fallback
 * com título genérico e preço padrão.
 *
 * @param {string} identificador
 * @param {number|string} quantidade
 * @returns {{title: string, quantity: number, unit_price: number, currency_id: string, retailer_id: string}}
 */
function resolverItem(identificador, quantidade) {
  const id = String(identificador).trim();
  const quantity = normalizarQuantidade(quantidade);
  const produto = buscarProduto(id);

  if (produto) {
    return {
      retailer_id: id,
      title: produto.title,
      quantity,
      unit_price: produto.price,
      currency_id: produto.currency_id || 'BRL',
    };
  }

  // Fallback: produto desconhecido no catálogo mock.
  return {
    retailer_id: id,
    title: `Produto ${id}`,
    quantity,
    unit_price: PRECO_PADRAO,
    currency_id: 'BRL',
  };
}

/**
 * Faz o parse do parâmetro multi-produto enviado pela Meta.
 *
 * A Meta pode enviar vários produtos em um único parâmetro `products`, no
 * formato "retailer_id:quantidade,retailer_id:quantidade" (também aceitamos
 * `;` ou `|` como separadores de item).
 *
 * @param {string} valor
 * @returns {Array<{identificador: string, quantidade: number}>}
 */
function parsearMultiprodutos(valor) {
  return String(valor)
    .split(/[,;|]/)
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) => {
      const [identificador, quantidade] = parte.split(':').map((p) => p.trim());
      return { identificador, quantidade: quantidade ?? 1 };
    })
    .filter((item) => item.identificador);
}

/**
 * Interpreta os parâmetros de query enviados pela Meta Commerce na URL de
 * finalização de compra e monta a lista de itens do pedido.
 *
 * Suporta tanto um único produto (product_id / external_id / item_id /
 * retailer_id / content_id + quantity) quanto múltiplos produtos via `products`.
 *
 * @param {Object} query - req.query
 * @returns {{
 *   items: Array<Object>,
 *   totalAmount: number,
 *   coupon: string|null,
 *   orderRef: string|null,
 *   customerPhone: string|null
 * }}
 */
export function interpretarCheckout(query = {}) {
  const items = [];

  // 1) Múltiplos produtos em um único parâmetro.
  if (query.products) {
    for (const { identificador, quantidade } of parsearMultiprodutos(query.products)) {
      items.push(resolverItem(identificador, quantidade));
    }
  }

  // 2) Produto único (cobre os diferentes nomes de parâmetro que a Meta pode usar).
  const idUnico =
    query.product_id ||
    query.retailer_id ||
    query.content_id ||
    query.item_id ||
    query.external_id ||
    query.id;

  if (idUnico) {
    const quantidade =
      query.quantity || query.product_quantity || query.qty || query.quantidade || 1;
    items.push(resolverItem(idUnico, quantidade));
  }

  const totalAmount = calcularTotal(items);

  return {
    items,
    totalAmount,
    coupon: query.coupon || query.coupon_code || query['coupon.code'] || null,
    orderRef: query.order_id || query.external_id || query.order_reference || null,
    customerPhone: query.phone || query.customer_phone || query.wa_id || null,
  };
}

/**
 * Monta a string de external_reference (JSON compacto) usada para rastrear o
 * pedido quando o webhook de pagamento for recebido.
 *
 * O Mercado Pago limita o external_reference a 256 caracteres, por isso
 * armazenamos apenas o essencial.
 *
 * @param {Object} dados
 * @returns {string}
 */
export function montarExternalReference({ customerPhone, orderRef, items, totalAmount }) {
  const payload = {
    src: 'meta_checkout',
    phone: customerPhone || null,
    ref: orderRef || null,
    total: totalAmount,
    items: (items || []).map((i) => ({ id: i.retailer_id, q: i.quantity })),
  };

  let json = JSON.stringify(payload);

  // Garante que não excede o limite do Mercado Pago.
  if (json.length > 256) {
    delete payload.items;
    json = JSON.stringify(payload);
  }

  return json;
}
