/**
 * Serviço de mensagens / templates de texto do bot.
 *
 * Centraliza todos os textos enviados ao cliente para facilitar ajustes
 * (tom de voz, informações da loja, etc.) em um único lugar.
 */

import { listarProdutos } from '../data/products.js';

const NOME_LOJA = 'La Empanadas Saltenhas Argentinas';

/**
 * Formata um valor numérico em moeda BRL.
 */
function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

/**
 * Mensagem de boas-vindas + cardápio completo.
 */
export function mensagemCardapio() {
  const produtos = listarProdutos();
  const linhas = produtos
    .map((p, i) => `${i + 1}️⃣ *${p.title}* — ${formatarPreco(p.price)}`)
    .join('\n');

  return (
    `🥟 *${NOME_LOJA}* 🇦🇷\n\n` +
    `Olá! Bem-vindo(a)! Confira nosso cardápio:\n\n` +
    `${linhas}\n\n` +
    `📝 *Como pedir:*\n` +
    `Escreva a quantidade e o sabor. Exemplos:\n` +
    `• _2 carne 1 cheeseburger_\n` +
    `• _3 frango_\n` +
    `• _duas de atum_\n\n` +
    `É só mandar seu pedido que eu monto tudo pra você! 😉`
  );
}

/**
 * Resumo do carrinho para o cliente confirmar.
 *
 * @param {Array<{produto: object, quantidade: number}>} carrinho
 * @param {number} total
 */
export function mensagemResumoPedido(carrinho, total) {
  const linhas = carrinho
    .map(
      item =>
        `• ${item.quantidade}x ${item.produto.title} — ${formatarPreco(
          item.produto.price * item.quantidade
        )}`
    )
    .join('\n');

  return (
    `🛒 *Seu pedido:*\n\n` +
    `${linhas}\n\n` +
    `💰 *Total: ${formatarPreco(total)}*\n\n` +
    `✅ Digite *SIM* para confirmar e gerar o pagamento\n` +
    `❌ Digite *NÃO* para cancelar e recomeçar`
  );
}

/**
 * Mensagem com itens não reconhecidos.
 *
 * @param {Array<{termo: string}>} desconhecidos
 */
export function mensagemItensNaoReconhecidos(desconhecidos) {
  const termos = desconhecidos.map(d => `"${d.termo}"`).join(', ');
  return (
    `🤔 Não encontrei ${termos} no nosso cardápio.\n\n` +
    `Digite *CARDÁPIO* para ver todos os sabores disponíveis.`
  );
}

/**
 * Mensagem pedindo o endereço de entrega (após confirmar o pedido).
 */
export function mensagemPedirEndereco() {
  return (
    `📍 *Endereço de entrega*\n\n` +
    `Para finalizar, me envie o endereço completo da entrega:\n\n` +
    `_Rua, número, bairro, complemento e ponto de referência._\n\n` +
    `Exemplo:\n` +
    `_Rua das Flores, 123, Centro, apto 45 - próximo ao mercado_`
  );
}

/**
 * Mensagem quando o endereço enviado parece incompleto.
 */
export function mensagemEnderecoIncompleto() {
  return (
    `🤔 O endereço parece incompleto.\n\n` +
    `Por favor, envie o endereço completo com *rua, número e bairro*.\n\n` +
    `Exemplo:\n` +
    `_Rua das Flores, 123, Centro, apto 45_`
  );
}

/**
 * Corpo da mensagem com o link de pagamento (usado no botão CTA).
 *
 * @param {number} total
 * @param {string} endereco
 */
export function corpoPagamento(total, endereco) {
  return (
    `🎉 *Pedido confirmado!*\n\n` +
    (endereco ? `📍 Entrega em: ${endereco}\n\n` : '') +
    `Valor: *${formatarPreco(total)}*\n\n` +
    `Toque no botão abaixo para pagar pelo Mercado Pago 👇`
  );
}

/**
 * Mensagem com o link de pagamento (fallback em texto puro).
 *
 * @param {number} total
 * @param {string} link
 * @param {string} [endereco]
 */
export function mensagemLinkPagamento(total, link, endereco) {
  return (
    `🎉 Pedido confirmado!\n\n` +
    (endereco ? `📍 Entrega em: ${endereco}\n\n` : '') +
    `💳 *Pague aqui pelo Mercado Pago:*\n${link}\n\n` +
    `Valor: *${formatarPreco(total)}*\n\n` +
    `Assim que o pagamento for aprovado, você recebe a confirmação por aqui. ` +
    `Obrigado pela preferência! 🥟❤️`
  );
}

/**
 * Mensagem de pedido cancelado.
 */
export function mensagemCancelado() {
  return (
    `🗑️ Pedido cancelado!\n\n` +
    `Quando quiser pedir de novo, é só mandar uma mensagem ou digitar *CARDÁPIO*. 😊`
  );
}

/**
 * Mensagem quando o bot não entende a mensagem.
 */
export function mensagemNaoEntendi() {
  return (
    `😅 Desculpe, não entendi.\n\n` +
    `Digite *CARDÁPIO* para ver os sabores ou faça seu pedido assim:\n` +
    `_2 carne 1 frango_`
  );
}

/**
 * Mensagem de ajuda.
 */
export function mensagemAjuda() {
  return (
    `ℹ️ *Como funciona:*\n\n` +
    `1️⃣ Digite *CARDÁPIO* para ver os sabores\n` +
    `2️⃣ Faça seu pedido (ex: _2 carne 1 frango_)\n` +
    `3️⃣ Confirme digitando *SIM*\n` +
    `4️⃣ Pague pelo link do Mercado Pago\n` +
    `5️⃣ Receba a confirmação aqui! 🥟\n\n` +
    `Precisa de algo? É só mandar mensagem!`
  );
}

/**
 * Mensagem quando não há nada para confirmar.
 */
export function mensagemNadaParaConfirmar() {
  return (
    `🤔 Você ainda não fez nenhum pedido.\n\n` +
    `Digite *CARDÁPIO* para começar ou mande seu pedido (ex: _2 carne_).`
  );
}

/**
 * Notificação enviada ao DONO da loja quando um pedido é pago.
 *
 * @param {object} dados
 */
export function mensagemNotificacaoDono({ cliente, itens, total, referencia, endereco }) {
  let linhasItens = '';
  if (Array.isArray(itens) && itens.length > 0) {
    linhasItens =
      '\n📦 *Itens:*\n' +
      itens
        .map(i => `• ${i.quantidade}x ${i.titulo || i.title || 'Item'}`)
        .join('\n') +
      '\n';
  }

  return (
    `🔔 *NOVO PEDIDO PAGO!*\n\n` +
    `👤 Cliente: ${cliente || 'não informado'}\n` +
    (referencia ? `🧾 Pedido: ${referencia}\n` : '') +
    linhasItens +
    (endereco ? `\n📍 *Entrega:* ${endereco}\n` : '') +
    (total ? `\n💰 *Total: ${formatarPreco(total)}*\n` : '') +
    `✅ Pagamento aprovado`
  );
}

export { formatarPreco, NOME_LOJA };

export default {
  mensagemCardapio,
  mensagemResumoPedido,
  mensagemItensNaoReconhecidos,
  mensagemLinkPagamento,
  mensagemCancelado,
  mensagemNaoEntendi,
  mensagemAjuda,
  mensagemNadaParaConfirmar,
  mensagemNotificacaoDono,
};
