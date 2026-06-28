/**
 * Serviço de NLP (processamento de linguagem natural) simples.
 *
 * Responsável por interpretar as mensagens de texto enviadas pelo cliente
 * no WhatsApp e identificar:
 *   - a INTENÇÃO da mensagem (saudação, ver cardápio, fazer pedido, confirmar...)
 *   - os ITENS do pedido (quantidade + sabor), quando aplicável.
 *
 * É uma abordagem baseada em regras (regex + palavras-chave), suficiente para
 * o domínio fechado de uma loja de empanadas. Não depende de serviços externos.
 */

import { buscarProdutoPorTermo } from '../data/products.js';

/**
 * Remove acentos e normaliza o texto para comparação.
 */
function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const SAUDACOES = [
  'oi', 'ola', 'ole', 'eai', 'e ai', 'bom dia', 'boa tarde', 'boa noite',
  'menu', 'cardapio', 'cardapios', 'comecar', 'comeca', 'inicio', 'start',
];

const CONFIRMACOES = ['sim', 's', 'confirmar', 'confirmo', 'confirma', 'ok', 'okay', 'pode', 'isso', 'fechado', 'fechar pedido', 'finalizar'];
const CANCELAMENTOS = ['nao', 'n', 'cancelar', 'cancela', 'cancelado', 'desistir', 'limpar', 'recomecar', 'apagar'];
const PEDIDOS_AJUDA = ['ajuda', 'help', 'como funciona', 'duvida'];

/**
 * Converte números escritos por extenso (um, dois...) em dígitos.
 */
const NUMEROS_EXTENSO = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
};

/**
 * Detecta a intenção principal de uma mensagem de texto.
 *
 * @param {string} texto
 * @returns {'saudacao'|'confirmar'|'cancelar'|'ajuda'|'pedido'|'desconhecido'}
 */
export function detectarIntencao(texto) {
  const t = normalizar(texto);
  if (!t) return 'desconhecido';

  // Saudações / pedir cardápio (mensagem curta e exata)
  if (SAUDACOES.includes(t)) return 'saudacao';

  // Confirmação / cancelamento (exatos)
  if (CONFIRMACOES.includes(t)) return 'confirmar';
  if (CANCELAMENTOS.includes(t)) return 'cancelar';
  if (PEDIDOS_AJUDA.some(p => t.includes(p))) return 'ajuda';

  // Se há itens identificáveis, é um pedido
  const itens = extrairItens(texto);
  if (itens.length > 0) return 'pedido';

  // Saudação contida no texto (ex.: "boa noite, quero ver o cardapio")
  if (SAUDACOES.some(s => t.includes(s))) return 'saudacao';

  return 'desconhecido';
}

/**
 * Extrai os itens de pedido de um texto livre.
 *
 * Reconhece padrões como:
 *   "2 carne 1 cheeseburger"
 *   "duas de frango e uma de atum"
 *   "quero 3 empanadas de carne"
 *   "carne" (assume quantidade 1)
 *
 * @param {string} texto
 * @returns {Array<{produto: object, quantidade: number, termo: string}>}
 */
export function extrairItens(texto) {
  const original = normalizar(texto);
  if (!original) return [];

  // Substitui números por extenso por dígitos para simplificar o parsing.
  let t = original;
  for (const [palavra, valor] of Object.entries(NUMEROS_EXTENSO)) {
    t = t.replace(new RegExp(`\\b${palavra}\\b`, 'g'), String(valor));
  }

  // Remove conectores e ruído comum.
  t = t
    .replace(/\bempanadas?\b/g, ' ')
    .replace(/\bde\b/g, ' ')
    .replace(/\bcom\b/g, ' ')
    .replace(/\bquero\b/g, ' ')
    .replace(/\bgostaria\b/g, ' ')
    .replace(/\bpor favor\b/g, ' ')
    .replace(/[,;]+/g, ' e ')
    .replace(/\s+/g, ' ')
    .trim();

  // Apelidos de produtos que contêm números: convertemos para formas SEM
  // dígito, para o número não ser confundido com a quantidade do pedido.
  // Ex.: "combo 4" -> "combo quatro", "coca 2l" -> "coca grande".
  t = t
    .replace(/combo\s*8\b/g, 'combo familia')
    .replace(/combo\s*4\b/g, 'combo quatro')
    .replace(/coca\s*2\s*l(itros|itro)?\b/g, 'coca grande')
    .replace(/\s+/g, ' ')
    .trim();

  const itens = [];
  const consumidos = new Set();

  // Padrão principal: (quantidade) (termo). Ex.: "2 carne", "1 cheeseburger".
  // Captura um número seguido de uma ou mais palavras até o próximo número.
  const regex = /(\d+)\s*x?\s*([a-z\s-]+?)(?=\s*\d|\s*$|\s+e\s)/g;
  let match;
  while ((match = regex.exec(t)) !== null) {
    const quantidade = parseInt(match[1], 10);
    const termo = match[2].replace(/\be\b/g, '').trim();
    if (!termo || quantidade <= 0) continue;

    const resultado = buscarProdutoPorTermo(termo);
    if (resultado) {
      itens.push({
        produto: resultado.produto,
        quantidade: Math.min(quantidade, 99),
        termo,
      });
      consumidos.add(resultado.produto.title);
    } else {
      // Termo não reconhecido — registra como item desconhecido para feedback.
      itens.push({ produto: null, quantidade, termo });
    }
  }

  // Se nada foi capturado pelo padrão "quantidade + termo", tenta achar
  // apenas o sabor (assumindo quantidade 1). Ex.: cliente digita só "carne".
  if (itens.length === 0) {
    const resultado = buscarProdutoPorTermo(t);
    if (resultado) {
      itens.push({ produto: resultado.produto, quantidade: 1, termo: t });
    }
  }

  return itens;
}

/**
 * Separa os itens válidos (produto reconhecido) dos não reconhecidos.
 *
 * @param {Array} itens
 * @returns {{validos: Array, desconhecidos: Array}}
 */
export function separarItens(itens) {
  const validos = [];
  const desconhecidos = [];
  for (const item of itens) {
    if (item.produto) validos.push(item);
    else desconhecidos.push(item);
  }
  return { validos, desconhecidos };
}

export default {
  detectarIntencao,
  extrairItens,
  separarItens,
};
