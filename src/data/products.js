/**
 * Catálogo de produtos (mock).
 *
 * Enquanto não há integração com um banco de dados / catálogo real,
 * usamos os dados das empanadas cadastradas no Meta Commerce Manager.
 *
 * Cada produto pode ser localizado por qualquer um dos seus identificadores
 * (retailer_id / content_id / item_id) através de `buscarProduto`.
 *
 * Observação: os preços estão em BRL.
 */

const PRODUTOS = [
  {
    title: 'Empanada de Carne con Ovo',
    price: 14.0,
    currency_id: 'BRL',
    ids: ['empanada-carne-ovo', '37635357806051241'],
    // Palavras-chave que o bot reconhece no texto do cliente.
    keywords: ['carne', 'carne com ovo', 'carne ovo', 'boi', 'carne con ovo'],
  },
  {
    title: 'Empanada Cheeseburger',
    price: 14.0,
    currency_id: 'BRL',
    ids: ['empanada-cheeseburger', '27494792396822629'],
    keywords: ['cheeseburger', 'cheese', 'burger', 'hamburguer', 'hamburger', 'x-burguer', 'xburguer'],
  },
  {
    title: 'Empanada de Atum com Queijo',
    price: 14.0,
    currency_id: 'BRL',
    ids: ['empanada-atum-queijo', '27085693970000000'],
    keywords: ['atum', 'atum com queijo', 'atum queijo', 'peixe'],
  },
  {
    title: 'Empanada de Frango com Espinafre e Queijo',
    price: 14.0,
    currency_id: 'BRL',
    ids: ['empanada-frango-espinafre', '42000000000000000'],
    keywords: ['frango', 'frango com espinafre', 'frango espinafre', 'galinha', 'chicken', 'espinafre'],
  },
];

/**
 * Preço padrão usado como fallback quando o identificador recebido da Meta
 * não corresponde a nenhum produto conhecido no catálogo mock.
 */
export const PRECO_PADRAO = 14.0;

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
 * @returns {{title: string, price: number, currency_id: string, ids: string[]}|null}
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
 * (ex.: "carne", "frango", "cheeseburger"). Faz correspondência por
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

export default PRODUTOS;
