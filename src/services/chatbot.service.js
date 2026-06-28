/**
 * Serviço do chatbot conversacional.
 *
 * Orquestra a conversa por texto com o cliente no WhatsApp, combinando:
 *   - NLP (detecção de intenção e extração de itens)
 *   - estado da conversa (sessão / carrinho / endereço)
 *   - geração do link de pagamento no Mercado Pago
 *   - templates de mensagem
 *
 * A função principal `processarMensagemTexto` recebe o telefone e o texto do
 * cliente e devolve uma RESPOSTA ESTRUTURADA que o webhook envia de volta:
 *   - { tipo: 'texto', texto }                              -> mensagem comum
 *   - { tipo: 'botao_url', corpo, textoBotao, url, rodape } -> botão de pagamento
 */

import { detectarIntencao, extrairItens, separarItens } from './nlp.service.js';
import {
  obterSessao,
  atualizarSessao,
  definirCarrinho,
  limparSessao,
  ESTADOS,
} from './conversation.service.js';
import { criarPreferencia } from './payment.service.js';
import {
  mensagemCardapio,
  mensagemResumoPedido,
  mensagemItensNaoReconhecidos,
  mensagemPedirEndereco,
  mensagemEnderecoIncompleto,
  corpoPagamento,
  mensagemCancelado,
  mensagemNaoEntendi,
  mensagemAjuda,
  mensagemNadaParaConfirmar,
} from './messages.service.js';

/** Helper: resposta de texto simples. */
function texto(t) {
  return { tipo: 'texto', texto: t };
}

/**
 * Valida se o endereço enviado parece completo o suficiente.
 * Critério simples: tem um número (logradouro) e comprimento mínimo.
 */
function enderecoValido(endereco) {
  if (!endereco) return false;
  const limpo = endereco.trim();
  const temNumero = /\d/.test(limpo);
  return limpo.length >= 8 && temNumero;
}

/**
 * Monta a referência externa (JSON compacto) para rastrear o pedido no webhook
 * do Mercado Pago. Inclui telefone, itens e endereço (resumido se necessário).
 */
function montarReferencia(telefone, carrinho, total, endereco) {
  const payload = {
    src: 'wpp_chat',
    phone: telefone,
    total,
    addr: endereco || null,
    items: carrinho.map(i => ({
      t: i.produto.title,
      q: i.quantidade,
    })),
  };

  let json = JSON.stringify(payload);

  // O Mercado Pago limita external_reference a 256 caracteres.
  // Reduz progressivamente para caber.
  if (json.length > 256) {
    payload.addr = (endereco || '').slice(0, 60) || null;
    json = JSON.stringify(payload);
  }
  if (json.length > 256) {
    payload.items = carrinho.map(i => ({ q: i.quantidade }));
    json = JSON.stringify(payload);
  }
  if (json.length > 256) {
    delete payload.addr;
    json = JSON.stringify(payload);
  }
  return json;
}

/**
 * Gera o link de pagamento do Mercado Pago para o carrinho atual.
 */
async function gerarLinkPagamento(telefone, carrinho, total, endereco) {
  const items = carrinho.map(item => ({
    title: item.produto.title,
    quantity: item.quantidade,
    unit_price: item.produto.price,
    currency_id: item.produto.currency_id || 'BRL',
  }));

  const { initPoint, sandboxInitPoint } = await criarPreferencia({
    items,
    externalReference: montarReferencia(telefone, carrinho, total, endereco),
    metadata: {
      customer_phone: telefone,
      source: 'whatsapp_chat',
      delivery_address: endereco || null,
    },
    baseUrl: process.env.BASE_URL,
  });

  return initPoint || sandboxInitPoint;
}

/**
 * Finaliza o pedido: gera o pagamento e retorna a resposta com botão.
 */
async function finalizarPedido(sessao) {
  const { telefone, carrinho, total, endereco } = sessao;
  const link = await gerarLinkPagamento(telefone, carrinho, total, endereco);
  limparSessao(telefone);
  return {
    tipo: 'botao_url',
    corpo: corpoPagamento(total, endereco),
    textoBotao: 'Pagar agora',
    url: link,
    rodape: 'Pagamento seguro via Mercado Pago',
  };
}

/**
 * Processa uma mensagem de texto do cliente e retorna a resposta do bot.
 *
 * @param {string} telefone
 * @param {string} mensagem
 * @returns {Promise<object>} resposta estruturada (ver topo do arquivo)
 */
export async function processarMensagemTexto(telefone, mensagem) {
  const sessao = obterSessao(telefone);
  const intencao = detectarIntencao(mensagem);

  console.log('[chatbot] mensagem recebida', {
    telefone,
    mensagem,
    intencao,
    estado: sessao.estado,
  });

  // ---------------------------------------------------------------------------
  // ETAPA: aguardando endereço de entrega.
  // Quando o cliente já confirmou o pedido, a próxima mensagem é o endereço.
  // ---------------------------------------------------------------------------
  if (sessao.estado === ESTADOS.AGUARDANDO_ENDERECO) {
    // Permite cancelar ou recomeçar mesmo nessa etapa.
    if (intencao === 'cancelar') {
      limparSessao(telefone);
      return texto(mensagemCancelado());
    }
    if (intencao === 'saudacao') {
      return texto(mensagemCardapio());
    }

    // Trata a mensagem como o endereço de entrega.
    if (!enderecoValido(mensagem)) {
      return texto(mensagemEnderecoIncompleto());
    }

    atualizarSessao(telefone, { endereco: mensagem.trim() });
    const sessaoAtual = obterSessao(telefone);

    try {
      return await finalizarPedido(sessaoAtual);
    } catch (erro) {
      console.error('[chatbot] erro ao gerar pagamento:', erro.message);
      return texto(
        '😥 Tive um problema ao gerar o link de pagamento. ' +
          'Tente novamente em instantes ou digite *CARDÁPIO* para recomeçar.'
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Demais etapas, conforme a intenção detectada.
  // ---------------------------------------------------------------------------
  switch (intencao) {
    case 'saudacao':
      return texto(mensagemCardapio());

    case 'ajuda':
      return texto(mensagemAjuda());

    case 'cancelar':
      limparSessao(telefone);
      return texto(mensagemCancelado());

    case 'confirmar': {
      // Só confirma se houver carrinho aguardando confirmação.
      if (
        sessao.estado !== ESTADOS.AGUARDANDO_CONFIRMACAO ||
        !sessao.carrinho?.length
      ) {
        return texto(mensagemNadaParaConfirmar());
      }
      // Avança para a etapa de coleta do endereço.
      atualizarSessao(telefone, { estado: ESTADOS.AGUARDANDO_ENDERECO });
      return texto(mensagemPedirEndereco());
    }

    case 'pedido': {
      const itens = extrairItens(mensagem);
      const { validos, desconhecidos } = separarItens(itens);

      if (validos.length === 0) {
        return texto(mensagemItensNaoReconhecidos(desconhecidos));
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

      return texto(resposta);
    }

    default:
      return texto(mensagemNaoEntendi());
  }
}

export default { processarMensagemTexto };
