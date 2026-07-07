/**
 * Serviço de mensagens / templates de texto do bot.
 *
 * Centraliza todos os textos enviados ao cliente para facilitar ajustes
 * (tom de voz, informações da loja, etc.) em um único lugar.
 */

import { listarPorCategoria } from '../data/products.js';

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
  const grupos = listarPorCategoria();

  const blocos = grupos
    .map(grupo => {
      const linhas = grupo.produtos
        .map(p => {
          const desc = p.descricao ? ` _(${p.descricao})_` : '';
          return `• *${p.title}*${desc} — ${formatarPreco(p.price)}`;
        })
        .join('\n');
      return `*${grupo.titulo}*\n${linhas}`;
    })
    .join('\n\n');

 return (
  `🥟 *${NOME_LOJA}* 🇦🇷\n\n` +
  `Olá! Bem‑vindo(a). Bateu a fome? Estamos abertos nos seguintes horários:
• Seg à Qui e Dom: 18h às 22h
• Sex e Sáb: 18h às 23h

Dê uma olhada no nosso cardápio completo e escolha o seu favorito de hoje! 😋\n\n` +
  `${blocos}\n\n` +
  `📝 *Como pedir (leia com atenção):*\n` +
  `1) Escreva seu pedido aqui com quantidade e sabor.\n` +
  `   Exemplos:\n` +
  `   • _2x Carne_\n` +
  `   • _1x Cheeseburger, 2x Frango_\n` +
  `   • _2 de atum e 1 Coca_\n\n` +
  `2) Enviaremos o resumo do pedido e o *link de pagamento*.\n` +
  `3) *A produção só começa após a confirmação do pagamento.*\n\n` +
  `⚠️ *IMPORTANTE:* Pelo WhatsApp aceitamos apenas *pedidos e pagamento por link* — *não há atendimento por mensagens*. \n` +
  `Para falar com um atendente por voz, *ligue* para: 📞 *(11) 2669‑0644*.\n\n` +
  `Se tiver dificuldade com o pagamento, ligue antes de enviar o pedido. Obrigado!`
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
    .map(item => {
      let linha = `• ${item.quantidade}x ${item.produto.title} — ${formatarPreco(
        item.produto.price * item.quantidade
      )}`;
      // Se for combo com sabores escolhidos, lista os sabores embaixo.
      if (Array.isArray(item.sabores) && item.sabores.length > 0) {
        const saboresTxt = item.sabores
          .map(s => `   ↳ ${s.quantidade}x ${s.title}`)
          .join('\n');
        linha += `\n${saboresTxt}`;
      }
      return linha;
    })
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
 * Pede ao cliente que escolha os sabores de um combo.
 *
 * @param {object} produto - o combo
 * @param {number} faltam - quantas empanadas ainda faltam escolher
 */
export function mensagemPedirSaboresCombo(produto, faltam) {
  return (
    `🥟 *${produto.title}*\n\n` +
    `Esse combo inclui *${faltam} empanadas* à sua escolha!\n\n` +
    `Me diga os sabores e as quantidades. Exemplos:\n` +
    `• _2 carne 2 frango_\n` +
    `• _1 calabresa 1 atum 1 palmito 1 cheeseburger_\n\n` +
    `Digite *CARDÁPIO* se quiser rever os sabores. 😉`
  );
}

/**
 * Avisa quantas empanadas ainda faltam para completar o combo.
 *
 * @param {object} produto
 * @param {number} faltam
 * @param {Array<{title: string, quantidade: number}>} escolhas
 */
export function mensagemSaboresFaltam(produto, faltam, escolhas) {
  const jaEscolhidos =
    escolhas && escolhas.length > 0
      ? `Até agora:\n` +
        escolhas.map(s => `• ${s.quantidade}x ${s.title}`).join('\n') +
        `\n\n`
      : '';
  return (
    `👍 Anotado!\n\n` +
    jaEscolhidos +
    `Ainda *faltam ${faltam} empanada(s)* para completar o *${produto.title}*.\n\n` +
    `Quais sabores você quer? (ex: _2 carne_)`
  );
}

/**
 * Avisa que o cliente escolheu mais sabores do que o combo permite.
 *
 * @param {object} produto
 * @param {number} excedente
 */
export function mensagemSaboresExcedido(produto, excedente) {
  return (
    `⚠️ Opa! Você escolheu *${excedente} empanada(s) a mais* do que o ` +
    `*${produto.title}* permite.\n\n` +
    `Por favor, mande os sabores de novo respeitando a quantidade do combo. 🙏`
  );
}

/**
 * Avisa que nenhum sabor de empanada válido foi reconhecido na mensagem
 * (durante a escolha de sabores do combo).
 */
export function mensagemSaborComboNaoReconhecido() {
  return (
    `🤔 Não reconheci esses sabores.\n\n` +
    `Para o combo, escolha apenas *empanadas* (ex: _2 carne 1 frango_).\n` +
    `Digite *CARDÁPIO* para ver todos os sabores.`
  );
}

/**
 * Corpo do lembrete de pagamento pendente (usado no botão CTA).
 *
 * @param {number} total
 */
export function corpoLembretePagamento(total) {
  return (
    `😊 *Oi! Seu pedido está quase lá...*\n\n` +
    `Notei que o pagamento de *${formatarPreco(total)}* ainda não foi concluído.\n\n` +
    `É rapidinho! Toque no botão abaixo para finalizar e garantir suas empanadas quentinhas 🥟👇`
  );
}

/**
 * Lembrete de carrinho abandonado (cliente montou o pedido mas não confirmou).
 *
 * @param {number} total
 */
export function mensagemLembreteCarrinho(total) {
  return (
    `🥟 *Ainda está aí?*\n\n` +
    `Seu pedido de *${formatarPreco(total)}* está montado e esperando por você!\n\n` +
    `✅ Digite *SIM* para confirmar e finalizar\n` +
    `❌ Digite *NÃO* para cancelar`
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
export function mensagemPedirNome() {
  return (
    `😊 *Quase lá!*\n\n` +
    `Como podemos te chamar? Me diga o seu *nome*, por favor.`
  );
}

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
export function mensagemNotificacaoDono({ cliente, nome, itens, total, referencia, endereco }) {
  let linhasItens = '';
  if (Array.isArray(itens) && itens.length > 0) {
    linhasItens =
      '\n📦 *Itens:*\n' +
      itens
        .map(i => {
          let linha = `• ${i.quantidade}x ${i.titulo || i.title || 'Item'}`;
          // Mostra os sabores escolhidos quando for combo.
          if (Array.isArray(i.sabores) && i.sabores.length > 0) {
            linha +=
              '\n' +
              i.sabores
                .map(s => `   ↳ ${s.quantidade}x ${s.titulo || s.title || 'Sabor'}`)
                .join('\n');
          }
          return linha;
        })
        .join('\n') +
      '\n';
  }

  return (
    `🔔 *NOVO PEDIDO PAGO!*\n\n` +
    `👤 Cliente: ${nome ? `${nome}` : 'não informado'}\n` +
    `📱 WhatsApp: ${cliente || 'não informado'}\n` +
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
  mensagemPedirSaboresCombo,
  mensagemSaboresFaltam,
  mensagemSaboresExcedido,
  mensagemSaborComboNaoReconhecido,
  mensagemPedirNome,
  corpoLembretePagamento,
  mensagemLembreteCarrinho,
  mensagemLinkPagamento,
  mensagemCancelado,
  mensagemNaoEntendi,
  mensagemAjuda,
  mensagemNadaParaConfirmar,
  mensagemNotificacaoDono,
};
