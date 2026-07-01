/**
 * Serviço do chatbot conversacional.
 *
 * Orquestra a conversa por texto com o cliente no WhatsApp, combinando:
 *   - NLP (detecção de intenção e extração de itens)
 *   - estado da conversa (sessão / carrinho / combos / endereço)
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
import { ehCombo, ehEmpanada } from '../data/products.js';
import { criarPreferencia } from './payment.service.js';
import { registrarPagamentoPendente } from './lembrete.service.js';
import {
  mensagemCardapio,
  mensagemResumoPedido,
  mensagemItensNaoReconhecidos,
  mensagemPedirSaboresCombo,
  mensagemSaboresFaltam,
  mensagemSaboresExcedido,
  mensagemSaborComboNaoReconhecido,
  mensagemPedirNome,
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
 * Agrupa itens iguais (mesmo produto) somando as quantidades.
 *
 * @param {Array<{produto: object, quantidade: number}>} itens
 * @returns {Array<{produto: object, quantidade: number}>}
 */
function agruparItens(itens) {
  const mapa = new Map();
  for (const item of itens) {
    const chave = item.produto.title;
    if (mapa.has(chave)) {
      mapa.get(chave).quantidade += item.quantidade;
    } else {
      mapa.set(chave, { produto: item.produto, quantidade: item.quantidade });
    }
  }
  return Array.from(mapa.values());
}

/**
 * Soma as quantidades de uma lista de escolhas/itens.
 */
function somarQuantidades(lista) {
  return (lista || []).reduce((soma, i) => soma + (i.quantidade || 0), 0);
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
 * Valida se o texto enviado parece um nome de pessoa.
 * Critério simples: pelo menos 2 letras e sem parecer um endereço/número.
 */
function nomeValido(nome) {
  if (!nome) return false;
  const limpo = nome.trim();
  const letras = (limpo.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  return letras >= 2 && limpo.length <= 60;
}

/**
 * Limpa o nome do perfil (remove emojis/excesso) para uso interno.
 */
function limparNome(nome) {
  if (!nome) return null;
  const limpo = String(nome).replace(/\s+/g, ' ').trim();
  return limpo.length >= 2 ? limpo.slice(0, 60) : null;
}

/**
 * Após a confirmação do pedido, decide o próximo passo:
 *  - se já temos o nome (informado ou vindo do perfil do WhatsApp), pula direto
 *    para o endereço;
 *  - senão, pede o nome ao cliente.
 */
function avancarAposConfirmacao(telefone, sessao) {
  const nome = sessao.nome || limparNome(sessao.nomePerfil);
  if (nome) {
    atualizarSessao(telefone, { nome, estado: ESTADOS.AGUARDANDO_ENDERECO });
    return texto(mensagemPedirEndereco());
  }
  atualizarSessao(telefone, { estado: ESTADOS.AGUARDANDO_NOME });
  return texto(mensagemPedirNome());
}

/**
 * Monta a referência externa (JSON compacto) para rastrear o pedido no webhook
 * do Mercado Pago. Inclui telefone, itens e endereço (resumido se necessário).
 * Os sabores dos combos vão nos metadados (sem limite apertado), não aqui.
 */
function montarReferencia(telefone, carrinho, total, endereco, nome) {
  const payload = {
    src: 'wpp_chat',
    phone: telefone,
    nome: nome || null,
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
 * Monta a lista detalhada de itens para os metadados do pagamento.
 * Inclui os sabores escolhidos nos combos, para o dono ver na notificação.
 */
function montarItensMetadata(carrinho) {
  return carrinho.map(item => {
    const base = { titulo: item.produto.title, quantidade: item.quantidade };
    if (Array.isArray(item.sabores) && item.sabores.length > 0) {
      base.sabores = item.sabores.map(s => ({
        titulo: s.title,
        quantidade: s.quantidade,
      }));
    }
    return base;
  });
}

/**
 * Gera o link de pagamento do Mercado Pago para o carrinho atual.
 */
async function gerarLinkPagamento(telefone, carrinho, total, endereco, nome) {
  // Para o Mercado Pago, cada combo é um único item (preço do combo);
  // os sabores são apenas composição (vão nos metadados).
  const items = carrinho.map(item => ({
    title: item.produto.title,
    quantity: item.quantidade,
    unit_price: item.produto.price,
    currency_id: item.produto.currency_id || 'BRL',
  }));

  const { initPoint } = await criarPreferencia({
    items,
    externalReference: montarReferencia(telefone, carrinho, total, endereco, nome),
    metadata: {
      customer_phone: telefone,
      customer_name: nome || null,
      source: 'whatsapp_chat',
      delivery_address: endereco || null,
      order_items: montarItensMetadata(carrinho),
    },
    baseUrl: process.env.BASE_URL,
  });

  if (!initPoint) {
    throw new Error('Não foi possível obter o link de pagamento do Mercado Pago.');
  }

  return initPoint;
}

/**
 * Finaliza o pedido: gera o pagamento e retorna a resposta com botão.
 */
async function finalizarPedido(sessao) {
  const { telefone, carrinho, total, endereco, nome } = sessao;
  const link = await gerarLinkPagamento(telefone, carrinho, total, endereco, nome);

  // Registra o pagamento como PENDENTE para o serviço de lembretes.
  // Se o cliente não pagar em alguns minutos, recebe um lembrete automático.
  registrarPagamentoPendente(telefone, { link, total });

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
 * Inicia (ou continua) a coleta de sabores do primeiro combo pendente.
 * Retorna a mensagem pedindo os sabores do combo da vez.
 */
function pedirSaboresDoComboAtual(combosPendentes) {
  const atual = combosPendentes[0];
  const restante = atual.total - somarQuantidades(atual.escolhas);
  return texto(mensagemPedirSaboresCombo(atual.produto, restante));
}

/**
 * Trata a mensagem do cliente quando estamos coletando os sabores de um combo.
 */
function processarSaboresCombo(telefone, sessao, mensagem, intencao) {
  // Permite cancelar ou ver o cardápio sem perder o progresso.
  if (intencao === 'cancelar') {
    limparSessao(telefone);
    return texto(mensagemCancelado());
  }
  if (intencao === 'saudacao' || intencao === 'ajuda') {
    // Mostra o cardápio mas mantém o estado de coleta de sabores.
    return texto(mensagemCardapio());
  }

  const combosPendentes = sessao.combosPendentes || [];
  if (combosPendentes.length === 0) {
    // Estado inconsistente — recomeça.
    limparSessao(telefone);
    return texto(mensagemNaoEntendi());
  }

  const atual = combosPendentes[0];
  const restante = atual.total - somarQuantidades(atual.escolhas);

  // Extrai apenas empanadas (sabores válidos para combo).
  const itens = extrairItens(mensagem);
  const empanadas = itens.filter(i => i.produto && ehEmpanada(i.produto));

  if (empanadas.length === 0) {
    if (intencao === 'confirmar') {
      // Cliente tentou confirmar antes de terminar de escolher.
      return texto(mensagemSaboresFaltam(atual.produto, restante, atual.escolhas));
    }
    return texto(mensagemSaborComboNaoReconhecido());
  }

  const adicionando = somarQuantidades(empanadas);
  if (adicionando > restante) {
    return texto(mensagemSaboresExcedido(atual.produto, adicionando - restante));
  }

  // Adiciona os sabores escolhidos (agrupando por título).
  for (const emp of empanadas) {
    const existente = atual.escolhas.find(e => e.title === emp.produto.title);
    if (existente) {
      existente.quantidade += emp.quantidade;
    } else {
      atual.escolhas.push({ title: emp.produto.title, quantidade: emp.quantidade });
    }
  }

  const novoRestante = atual.total - somarQuantidades(atual.escolhas);

  if (novoRestante > 0) {
    atualizarSessao(telefone, { combosPendentes });
    return texto(mensagemSaboresFaltam(atual.produto, novoRestante, atual.escolhas));
  }

  // Combo atual completo — move para o carrinho base como linha de combo.
  const carrinhoBase = sessao.carrinhoBase || [];
  carrinhoBase.push({
    produto: atual.produto,
    quantidade: atual.quantidade,
    sabores: atual.escolhas,
  });
  combosPendentes.shift();

  if (combosPendentes.length > 0) {
    // Ainda há combos para configurar.
    atualizarSessao(telefone, { carrinhoBase, combosPendentes });
    return pedirSaboresDoComboAtual(combosPendentes);
  }

  // Todos os combos prontos — finaliza o carrinho e mostra o resumo.
  const sessaoFinal = definirCarrinho(telefone, carrinhoBase);
  atualizarSessao(telefone, { combosPendentes: [], carrinhoBase: [] });
  return texto(mensagemResumoPedido(sessaoFinal.carrinho, sessaoFinal.total));
}

/**
 * Processa um novo pedido (lista de itens), separando combos de itens normais.
 */
function processarNovoPedido(telefone, mensagem, desconhecidos, validos) {
  const combos = validos.filter(i => ehCombo(i.produto));
  const regulares = validos.filter(i => !ehCombo(i.produto));

  const carrinhoBase = agruparItens(regulares);

  if (combos.length > 0) {
    // Para cada combo, precisamos coletar (comboSize x quantidade) sabores.
    const combosAgrupados = agruparItens(combos);
    const combosPendentes = combosAgrupados.map(c => ({
      produto: c.produto,
      quantidade: c.quantidade,
      total: Number(c.produto.comboSize) * c.quantidade,
      escolhas: [],
    }));

    atualizarSessao(telefone, {
      estado: ESTADOS.AGUARDANDO_SABORES_COMBO,
      carrinhoBase,
      combosPendentes,
      lembreteCarrinhoEnviado: false,
    });

    let resposta = pedirSaboresDoComboAtual(combosPendentes).texto;
    if (desconhecidos.length > 0) {
      resposta = mensagemItensNaoReconhecidos(desconhecidos) + '\n\n' + resposta;
    }
    return texto(resposta);
  }

  // Sem combos — fluxo normal: define o carrinho e pede confirmação.
  const sessaoAtualizada = definirCarrinho(telefone, carrinhoBase);
  let resposta = mensagemResumoPedido(
    sessaoAtualizada.carrinho,
    sessaoAtualizada.total
  );
  if (desconhecidos.length > 0) {
    resposta = mensagemItensNaoReconhecidos(desconhecidos) + '\n\n' + resposta;
  }
  return texto(resposta);
}

/**
 * Processa uma mensagem de texto do cliente e retorna a resposta do bot.
 *
 * @param {string} telefone
 * @param {string} mensagem
 * @returns {Promise<object>} resposta estruturada (ver topo do arquivo)
 */
export async function processarMensagemTexto(telefone, mensagem, nomePerfil) {
  const sessao = obterSessao(telefone);
  const intencao = detectarIntencao(mensagem);

  // Guarda o nome do perfil do WhatsApp (se veio), para usar como nome do cliente.
  const perfilLimpo = limparNome(nomePerfil);
  if (perfilLimpo && sessao.nomePerfil !== perfilLimpo) {
    atualizarSessao(telefone, { nomePerfil: perfilLimpo });
    sessao.nomePerfil = perfilLimpo;
  }

  console.log('[chatbot] mensagem recebida', {
    telefone,
    mensagem,
    intencao,
    estado: sessao.estado,
    nomePerfil: sessao.nomePerfil,
  });

  // ---------------------------------------------------------------------------
  // ETAPA: coletando sabores de combo(s).
  // ---------------------------------------------------------------------------
  if (sessao.estado === ESTADOS.AGUARDANDO_SABORES_COMBO) {
    return processarSaboresCombo(telefone, sessao, mensagem, intencao);
  }

  // ---------------------------------------------------------------------------
  // ETAPA: aguardando o nome do cliente.
  // Só caímos aqui quando o nome não veio do perfil do WhatsApp.
  // ---------------------------------------------------------------------------
  if (sessao.estado === ESTADOS.AGUARDANDO_NOME) {
    if (intencao === 'cancelar') {
      limparSessao(telefone);
      return texto(mensagemCancelado());
    }

    if (!nomeValido(mensagem)) {
      return texto(
        '🤔 Não entendi o nome. Pode me dizer só o seu *nome*, por favor? (ex: _Maria_)'
      );
    }

    const nome = limparNome(mensagem);
    atualizarSessao(telefone, { nome, estado: ESTADOS.AGUARDANDO_ENDERECO });
    return texto(mensagemPedirEndereco());
  }

  // ---------------------------------------------------------------------------
  // ETAPA: aguardando endereço de entrega.
  // Quando o cliente já confirmou o pedido, a próxima mensagem é o endereço.
  // ---------------------------------------------------------------------------
  if (sessao.estado === ESTADOS.AGUARDANDO_ENDERECO) {
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
      // Avança: pede o nome (se não tivermos) ou já vai para o endereço.
      return avancarAposConfirmacao(telefone, sessao);
    }

    case 'pedido': {
      const itens = extrairItens(mensagem);
      const { validos, desconhecidos } = separarItens(itens);

      if (validos.length === 0) {
        return texto(mensagemItensNaoReconhecidos(desconhecidos));
      }

      return processarNovoPedido(telefone, mensagem, desconhecidos, validos);
    }

    default:
      return texto(mensagemNaoEntendi());
  }
}

export default { processarMensagemTexto };
