/**
 * Serviço de gerenciamento de estado da conversa (sessões).
 *
 * Mantém, em memória, o contexto de cada cliente identificado pelo número de
 * telefone. Permite que o bot lembre o carrinho atual e a etapa da conversa
 * entre mensagens (ex.: cliente faz o pedido, depois envia "sim" para confirmar).
 *
 * ATENÇÃO: o armazenamento é em memória (Map). No Cloud Run, cada instância
 * tem seu próprio estado e ele é perdido quando a instância reinicia/escala.
 * Para produção com múltiplas instâncias, troque por Redis/Firestore.
 * Para os testes iniciais (1 instância) funciona perfeitamente.
 */

// Estados possíveis da conversa.
export const ESTADOS = {
  INICIO: 'inicio',
  AGUARDANDO_SABORES_COMBO: 'aguardando_sabores_combo',
  AGUARDANDO_CONFIRMACAO: 'aguardando_confirmacao',
  AGUARDANDO_NOME: 'aguardando_nome',
  AGUARDANDO_ENDERECO: 'aguardando_endereco',
};

// Tempo de expiração da sessão (30 minutos).
const TTL_MS = 30 * 60 * 1000;

const sessoes = new Map();

/**
 * Recupera (ou cria) a sessão de um cliente.
 *
 * @param {string} telefone
 * @returns {{telefone: string, estado: string, carrinho: Array, total: number, atualizadoEm: number}}
 */
export function obterSessao(telefone) {
  const agora = Date.now();
  const existente = sessoes.get(telefone);

  if (existente && agora - existente.atualizadoEm < TTL_MS) {
    existente.atualizadoEm = agora;
    return existente;
  }

  const nova = {
    telefone,
    estado: ESTADOS.INICIO,
    carrinho: [],
    total: 0,
    endereco: null,
    // Nome do cliente (definido no pedido) e nome do perfil do WhatsApp.
    nome: null,
    nomePerfil: null,
    // Combos aguardando escolha de sabores (cada item: {produto, quantidade, faltam, escolhas}).
    combosPendentes: [],
    // Itens já definidos enquanto coletamos os sabores dos combos.
    carrinhoBase: [],
    // Controle de lembrete de carrinho abandonado (evita lembrar mais de uma vez).
    lembreteCarrinhoEnviado: false,
    atualizadoEm: agora,
  };
  sessoes.set(telefone, nova);
  return nova;
}

/**
 * Atualiza campos da sessão de um cliente.
 *
 * @param {string} telefone
 * @param {object} dados
 */
export function atualizarSessao(telefone, dados) {
  const sessao = obterSessao(telefone);
  Object.assign(sessao, dados, { atualizadoEm: Date.now() });
  sessoes.set(telefone, sessao);
  return sessao;
}

/**
 * Define o carrinho e recalcula o total da sessão.
 *
 * @param {string} telefone
 * @param {Array<{produto: object, quantidade: number}>} itens
 */
export function definirCarrinho(telefone, itens) {
  const total = itens.reduce(
    (soma, item) => soma + item.produto.price * item.quantidade,
    0
  );
  return atualizarSessao(telefone, {
    carrinho: itens,
    total,
    estado: ESTADOS.AGUARDANDO_CONFIRMACAO,
    lembreteCarrinhoEnviado: false,
  });
}

/**
 * Limpa a sessão (carrinho) do cliente, voltando ao estado inicial.
 *
 * @param {string} telefone
 */
export function limparSessao(telefone) {
  return atualizarSessao(telefone, {
    estado: ESTADOS.INICIO,
    carrinho: [],
    total: 0,
    endereco: null,
    // Mantém o nomePerfil (vem do WhatsApp a cada mensagem); zera o nome do pedido.
    nome: null,
    combosPendentes: [],
    carrinhoBase: [],
    lembreteCarrinhoEnviado: false,
  });
}

/**
 * Retorna todas as sessões ativas (em memória).
 * Usado pelo serviço de lembretes para detectar carrinhos abandonados.
 *
 * @returns {Array<object>}
 */
export function listarSessoes() {
  return Array.from(sessoes.values());
}

/**
 * Remove sessões expiradas (limpeza periódica simples).
 */
export function limparExpiradas() {
  const agora = Date.now();
  for (const [telefone, sessao] of sessoes.entries()) {
    if (agora - sessao.atualizadoEm >= TTL_MS) {
      sessoes.delete(telefone);
    }
  }
}

// Limpeza periódica a cada 10 minutos.
const intervalo = setInterval(limparExpiradas, 10 * 60 * 1000);
// Não impede o processo de encerrar (boa prática em Node).
if (intervalo.unref) intervalo.unref();

export default {
  ESTADOS,
  obterSessao,
  atualizarSessao,
  definirCarrinho,
  limparSessao,
  listarSessoes,
};
