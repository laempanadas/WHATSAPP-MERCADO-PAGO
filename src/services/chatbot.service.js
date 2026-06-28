/**
 * Serviço do chatbot conversacional.
 *
 * Orquestra a conversa por texto com o cliente no WhatsApp, combinando:
 *   - NLP (detecção de intenção e extração de itens)
 *   - estado da conversa (sessão / carrinho)
 *   - geração do link de pagamento no Mercado Pago
 *   - templates de mensagem
 *
 * A função principal `processarMensagemTexto` recebe o telefone e o texto do
 * cliente e devolve a resposta que o bot deve enviar de volta.
 */

import { detectarIntencao, extrairItens, separarItens } from './nlp.service.js';
import {
  obterSessao,
  definirCarrinho,
  limparSessao,
  ESTADOS,
} from './conversation.service.js';
import { criarPreferencia } from './payment.service.js';
import {
  mensagemCardapio,
  mensagemResumoPedido,
  mensagemItensNaoReconhecidos,
  mensagemLinkPagamento,
  mensagemCancelado,
  mensagemNaoEntendi,
  mensagemAjuda,
  mensagemNadaParaConfirmar,
} from './messages.service.js';

/**
 * Monta a referência externa (JSON compacto) para rastrear o pedido no webhook
 * do Mercado Pago. Inclui o telefone e os itens (id + quantidade).
 */
function montarReferencia(telefone, carrinho, total) {
  const payload = {
    src: 'wpp_chat',
    phone: telefone,
    total,
    items: carrinho.map(i => ({
      id: i.produto.ids?.[0] || i.produto.title,
      t: i.produto.title,
      q: i.quantidade,
    })),
  };

  let json = JSON.stringify(payload);
  if (json.length > 256) {
    // Reduz para caber no limite do Mercado Pago.
    payload.items = carrinho.map(i => ({ q: i.quantidade }));
    json = JSON.stringify(payload);
  }
  return json;
}

/**
 * Gera o link de pagamento do Mercado Pago para o carrinho atual.
 *
 * @param {string} telefone
 * @param {Array} carrinho
 * @param {number} total
 * @returns {Promise<string>} link de pagamento
 */
async function gerarLinkPagamento(telefone, carrinho, total) {
  const items = carrinho.map(item => ({
    title: item.produto.title,
    quantity: item.quantidade,
    unit_price: item.produto.price,
    currency_id: item.produto.currency_id || 'BRL',
  }));

  const { initPoint, sandboxInitPoint } = await criarPreferencia({
    items,
    externalReference: montarReferencia(telefone, carrinho, total),
    metadata: { customer_phone: telefone, source: 'whatsapp_chat' },
    baseUrl: process.env.BASE_URL,
  });

  return sandboxInitPoint || initPoint;
}

/**
 * Processa uma mensagem de texto do cliente e retorna a resposta do bot.
 *
 * @param {string} telefone
 * @param {string} texto
 * @returns {Promise<string>} mensagem de resposta
 */
export async function processarMensagemTexto(telefone, texto) {
  const sessao = obterSessao(telefone);
  const intencao = detectarIntencao(texto);

  console.log('[chatbot] mensagem recebida', {
    telefone,
    texto,
    intencao,
    estado: sessao.estado,
  });

  switch (intencao) {
    case 'saudacao':
      return mensagemCardapio();

    case 'ajuda':
      return mensagemAjuda();

    case 'cancelar':
      limparSessao(telefone);
      return mensagemCancelado();

    case 'confirmar': {
      // Só confirma se houver carrinho aguardando confirmação.
      if (
        sessao.estado !== ESTADOS.AGUARDANDO_CONFIRMACAO ||
        !sessao.carrinho?.length
      ) {
        return mensagemNadaParaConfirmar();
      }
      try {
        const link = await gerarLinkPagamento(
          telefone,
          sessao.carrinho,
          sessao.total
        );
        const total = sessao.total;
        limparSessao(telefone);
        return mensagemLinkPagamento(total, link);
      } catch (erro) {
        console.error('[chatbot] erro ao gerar pagamento:', erro.message);
        return (
          '😥 Tive um problema ao gerar o link de pagamento. ' +
          'Tente novamente em instantes ou digite *CARDÁPIO* para recomeçar.'
        );
      }
    }

    case 'pedido': {
      const itens = extrairItens(texto);
      const { validos, desconhecidos } = separarItens(itens);

      if (validos.length === 0) {
        return mensagemItensNaoReconhecidos(desconhecidos);
      }

      // Agrupa itens iguais (mesmo produto) somando quantidades.
      const mapa = new Map();
      for (const item of validos) {
        const chave = item.produto.title;
        if (mapa.has(chave)) {
          mapa.get(chave).quantidade += item.quantidade;
        } else {
          mapa.set(chave, { produto: item.produto, quantidade: item.quantidade });
        }
      }
      const carrinho = Array.from(mapa.values());

      const sessaoAtualizada = definirCarrinho(telefone, carrinho);

      let resposta = mensagemResumoPedido(
        sessaoAtualizada.carrinho,
        sessaoAtualizada.total
      );

      // Avisa sobre itens não reconhecidos, se houver.
      if (desconhecidos.length > 0) {
        resposta =
          mensagemItensNaoReconhecidos(desconhecidos) + '\n\n' + resposta;
      }

      return resposta;
    }

    default:
      return mensagemNaoEntendi();
  }
}

export default { processarMensagemTexto };
