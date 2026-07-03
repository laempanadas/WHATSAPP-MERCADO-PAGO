/**
 * Catálogo de produtos.
 *
 * Cardápio completo importado do iFood da loja
 * "La Empanadas Argentinas" (Santo André - SP).
 *
 * Cada produto pode ser localizado:
 *   - por identificador (retailer_id / content_id / item_id) -> `buscarProduto`
 *     (usado no fluxo do Meta Commerce / rota /checkout)
 *   - por termo livre digitado pelo cliente (palavras-chave) ->
 *     `buscarProdutoPorTermo` (usado no chatbot do WhatsApp)
 *
 * IMPORTANTE sobre as palavras-chave (keywords):
 * O NLP remove do texto do cliente as palavras "de", "com" e "empanada(s)".
 * Por isso as keywords devem estar na forma "limpa", SEM essas palavras.
 * Ex.: o cliente digita "frango com espinafre" -> vira "frango espinafre",
 * então a keyword deve ser "frango espinafre".
 *
 * Observação: os preços estão em BRL (usamos o preço de venda atual do iFood).
 */

// Ordem das categorias exibidas no cardápio.
export const CATEGORIAS = [
  { id: 'salgadas', titulo: '🥟 Empanadas Salgadas' },
  { id: 'doces', titulo: '🍫 Empanadas Doces' },
  { id: 'combos', titulo: '🎉 Combos' },
  { id: 'bebidas', titulo: '🥤 Bebidas' },
  { id: 'vinhos', titulo: '🍷 Vinhos (maiores de 18 anos)' },
];

const PRODUTOS = [
  // ----------------------- EMPANADAS SALGADAS -----------------------
  {
    title: 'Empanada de Carne com Ovos',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-carne-ovo', '37635357806051241'],
    keywords: ['carne ovo', 'carne ovos', 'carne con ovo', 'carne', 'boi'],
  },
  {
    title: 'Empanada de Costela',
    price: 15.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-costela'],
    keywords: ['costela', 'costela desfiada', 'costela churrasco'],
  },
  {
    title: 'Empanada de Frango com Espinafre e Cheddar',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-frango-espinafre', '42000000000000000'],
    keywords: ['frango espinafre cheddar', 'frango espinafre', 'frango cheddar', 'frango', 'galinha', 'chicken'],
  },
  {
    title: 'Empanada de Calabresa com Cream Cheese',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-calabresa-cream-cheese'],
    keywords: ['calabresa cream cheese', 'calabresa', 'linguica'],
  },
  {
    title: 'Empanada de Espinafre com Ricota e Tomate Seco',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-espinafre-ricota'],
    keywords: ['espinafre ricota tomate seco', 'espinafre ricota', 'ricota tomate seco', 'ricota', 'espinafre'],
  },
  {
    title: 'Empanada de Hambúrguer com Cheddar',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-hamburguer-cheddar', '27494792396822629'],
    keywords: ['hamburguer cheddar', 'hamburguer', 'hamburger', 'x-burguer', 'xburguer'],
  },
  {
    title: 'Empanada Bacon Cheeseburger',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-bacon-cheeseburger'],
    keywords: ['bacon cheeseburger', 'cheeseburger', 'cheese burger', 'bacon'],
  },
  {
    title: 'Empanada Portuguesa',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-portuguesa'],
    keywords: ['portuguesa', 'portugues', 'presunto'],
  },
  {
    title: 'Empanada de Queijo, Tomate, Manjericão e Orégano',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-queijo-manjericao'],
    keywords: ['queijo tomate manjericao', 'queijo manjericao', 'manjericao', 'caprese'],
  },
  {
    title: 'Empanada de Queijo com Cebola Caramelizada',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-queijo-cebola-caramelizada'],
    keywords: ['queijo cebola caramelizada', 'cebola caramelizada', 'queijo cebola', 'cebola'],
  },
  {
    title: 'Empanada de Escarola com Queijo',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-escarola-queijo'],
    keywords: ['escarola queijo', 'escarola'],
  },
  {
    title: 'Empanada de Atum com Queijos',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-atum-queijo', '27085693970000000'],
    keywords: ['atum queijo', 'atum queijos', 'atum', 'peixe'],
  },
  {
    title: 'Empanada de Palmito',
    price: 14.00,
    currency_id: 'BRL',
    categoria: 'salgadas',
    ids: ['empanada-palmito'],
    keywords: ['palmito'],
  },

  // ------------------------- EMPANADAS DOCES -------------------------
  {
    title: 'Empanada de Chocolate ao Leite com Morango',
    price: 16.9,
    currency_id: 'BRL',
    categoria: 'doces',
    ids: ['empanada-chocolate-morango'],
    keywords: ['chocolate morango', 'chocolate ao leite morango', 'chocolate', 'morango'],
  },
  {
    title: 'Empanada Romeu e Julieta',
    price: 14.5,
    currency_id: 'BRL',
    categoria: 'doces',
    ids: ['empanada-romeu-julieta'],
    keywords: ['romeu e julieta', 'romeu julieta', 'romeu', 'julieta', 'goiabada'],
  },

  // ----------------------------- COMBOS -----------------------------
  {
    title: 'Combo Coca-Cola (4 Empanadas + Coca 600ml)',
    price: 61.9,
    currency_id: 'BRL',
    categoria: 'combos',
    descricao: '4 empanadas + Coca-Cola 600ml',
    comboSize: 4,
    ids: ['combo-coca'],
    keywords: ['combo coca-cola', 'combo coca', 'combo refrigerante'],
  },
  {
    title: 'Combo Família 8 Empanadas Assadas',
    price: 102.00,
    currency_id: 'BRL',
    categoria: 'combos',
    descricao: '8 empanadas assadas à sua escolha',
    comboSize: 8,
    ids: ['combo-familia-8'],
    keywords: ['combo familia', 'combo 8', 'combo oito', 'combo familia 8'],
  },
  {
    title: 'Combo 4 Empanadas',
    price: 52.9,
    currency_id: 'BRL',
    categoria: 'combos',
    descricao: '4 empanadas à sua escolha',
    comboSize: 4,
    ids: ['combo-4'],
    keywords: ['combo quatro', 'combo 4', 'combo 4 empanadas', 'combo casal'],
  },

  // ----------------------------- BEBIDAS ----------------------------
  {
    title: 'Coca-Cola Original 600ml',
    price: 9.0,
    currency_id: 'BRL',
    categoria: 'bebidas',
    ids: ['coca-600'],
    keywords: ['coca-cola original 600', 'coca original', 'coca 600', 'coca-cola', 'coca cola', 'coca', 'refrigerante'],
  },
  {
    title: 'Coca-Cola sem Açúcar 350ml',
    price: 7.0,
    currency_id: 'BRL',
    categoria: 'bebidas',
    ids: ['coca-sem-acucar-350'],
    keywords: ['coca sem acucar 350', 'coca sem acucar', 'coca lata', 'coca 350'],
  },
  {
    title: 'Coca-Cola Zero 600ml',
    price: 9.0,
    currency_id: 'BRL',
    categoria: 'bebidas',
    ids: ['coca-zero-600'],
    keywords: ['coca zero 600', 'coca cola zero', 'coca zero', 'zero'],
  },
  {
    title: 'Coca-Cola 2L',
    price: 16.0,
    currency_id: 'BRL',
    categoria: 'bebidas',
    ids: ['coca-2l'],
    keywords: ['coca grande', 'coca-cola 2l', 'coca 2l', 'coca 2 litros', 'coca litro'],
  },

  // ------------------------------ VINHOS ----------------------------
  {
    title: 'Vinho La Plata Branco Argentino 750ml',
    price: 55.9,
    currency_id: 'BRL',
    categoria: 'vinhos',
    ids: ['vinho-la-plata-branco'],
    keywords: ['vinho branco', 'la plata', 'vinho la plata', 'branco'],
  },
  {
    title: 'Vinho Tinto Argentino San Telmo Malbec 750ml',
    price: 79.9,
    currency_id: 'BRL',
    categoria: 'vinhos',
    ids: ['vinho-san-telmo-malbec'],
    keywords: ['vinho tinto malbec', 'san telmo', 'malbec', 'vinho tinto', 'tinto'],
  },
  {
    title: 'Vinho Tinto Seco Argentino Cavic 750ml',
    price: 40.0,
    currency_id: 'BRL',
    categoria: 'vinhos',
    ids: ['vinho-cavic'],
    keywords: ['vinho cavic', 'cavic', 'vinho tinto seco', 'tinto seco', 'vinho seco'],
  },
];

/**
 * Preço padrão usado como fallback quando o identificador recebido da Meta
 * não corresponde a nenhum produto conhecido no catálogo.
 */
export const PRECO_PADRAO = 14.9;

/**
 * Constrói um índice (Map) de identificador -> produto para busca O(1).
 */
const INDICE_PRODUTOS = (() => {
  const indice = new Map();
  for (const produto of PRODUTOS) {
    for (const id of produto.ids) {
      indice.set(String(id), produto);
    }
  }
  return indice;
})();

/**
 * Busca um produto pelo identificador (retailer_id / content_id / item_id).
 *
 * @param {string|number} identificador
 * @returns {object|null}
 */
export function buscarProduto(identificador) {
  if (identificador === undefined || identificador === null) {
    return null;
  }
  return INDICE_PRODUTOS.get(String(identificador).trim()) || null;
}

/**
 * Remove acentos e normaliza um texto para comparação de palavras-chave.
 */
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Busca um produto a partir de um termo livre digitado pelo cliente
 * (ex.: "carne", "frango espinafre", "coca zero"). Faz correspondência por
 * palavras-chave, priorizando a correspondência mais específica/longa.
 *
 * @param {string} termo
 * @returns {{produto: object, keyword: string}|null}
 */
export function buscarProdutoPorTermo(termo) {
  if (!termo) return null;
  const alvo = normalizar(termo);
  if (!alvo) return null;

  let melhor = null;
  let melhorTamanho = 0;

  for (const produto of PRODUTOS) {
    for (const keyword of produto.keywords || []) {
      const kw = normalizar(keyword);
      if (alvo.includes(kw) && kw.length > melhorTamanho) {
        melhor = { produto, keyword: kw };
        melhorTamanho = kw.length;
      }
    }
  }

  return melhor;
}

/**
 * Retorna a lista completa de produtos do catálogo.
 */
export function listarProdutos() {
  return PRODUTOS;
}

/**
 * Indica se o produto é uma empanada (sabor válido para escolher em combos).
 * São consideradas empanadas as categorias 'salgadas' e 'doces'.
 *
 * @param {object} produto
 * @returns {boolean}
 */
export function ehEmpanada(produto) {
  return !!produto && (produto.categoria === 'salgadas' || produto.categoria === 'doces');
}

/**
 * Indica se o produto é um combo que exige escolha de sabores.
 *
 * @param {object} produto
 * @returns {boolean}
 */
export function ehCombo(produto) {
  return !!produto && Number(produto.comboSize) > 0;
}

/**
 * Retorna os produtos agrupados por categoria, na ordem de `CATEGORIAS`.
 *
 * @returns {Array<{id: string, titulo: string, produtos: Array}>}
 */
export function listarPorCategoria() {
  return CATEGORIAS.map(cat => ({
    id: cat.id,
    titulo: cat.titulo,
    produtos: PRODUTOS.filter(p => p.categoria === cat.id),
  })).filter(grupo => grupo.produtos.length > 0);
}

export default PRODUTOS;
