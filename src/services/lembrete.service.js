/**
 * Serviço de lembretes automáticos (recuperação de vendas).
 *
 * Resolve dois cenários comuns que fazem a loja perder vendas:
 *
 *   1) PAGAMENTO PENDENTE — o cliente recebeu o link/botão de pagamento mas
 *      não concluiu o pagamento. Depois de alguns minutos, enviamos um
 *      lembrete gentil com o botão de pagamento novamente.
 *
 *   2) CARRINHO ABANDONADO — o cliente montou o pedido (ou ficou no meio do
 *      fluxo) mas não confirmou. Depois de alguns minutos de inatividade,
 *      enviamos um empurãozinho ("ainda está aí?").
 *
 * ────────────────────────────────────────────────────────────────────────────
 * IMPORTANTE (arquitetura):
 * O estado é mantido em MEMÓRIA, igual às sessões da conversa. Um agendador
 * (setInterval) roda dentro da própria instância do Cloud Run e verifica
 * periodicamente quem precisa de lembrete.
 *
 * Para que os lembretes disparem de forma confiável, a instância precisa
 * ficar "viva". Recomendação (ver ATIVAR_PAGAMENTOS_REAIS.md / README):
 *   - Configure o Cloud Run com **mínimo de 1 instância** (min-instances=1).
 *     É barato e mantém a memória (sessões + lembretes) sempre ativa.
 * Para escala maior no futuro, migrar este estado para Redis/Firestore e
 * disparar a verificação via Cloud Scheduler.
 * ────────────────────────────────────────────────────────────────────────────
 */

import {
  enviarMensagemWhatsApp,
  enviarBotaoUrlWhatsApp,
} from './whatsapp.service.js';
import {
  corpoLembretePagamento,
  mensagemLembreteCarrinho,
} from './messages.service.js';
import { listarSessoes, ESTADOS } from './conversation.service.js';

const MINUTO = 60 * 1000;

// Tempos configuráveis por variável de ambiente (em minutos).
const LEMBRETE_PAGAMENTO_MIN = Number(process.env.LEMBRETE_PAGAMENTO_MIN || 15);
const EXPIRA_PAGAMENTO_MIN = Number(process.env.EXPIRA_PAGAMENTO_MIN || 120);
const LEMBRETE_CARRINHO_MIN = Number(process.env.LEMBRETE_CARRINHO_MIN || 10);
const EXPIRA_CARRINHO_MIN = Number(process.env.EXPIRA_CARRINHO_MIN || 30);

// Pagamentos pendentes: telefone -> { telefone, link, total, criadoEm, lembreteEnviado }
const pagamentosPendentes = new Map();

let agendadorIniciado = false;

/**
 * Registra um pagamento como pendente (chamado quando o link é gerado).
 *
 * @param {string} telefone
 * @param {{link: string, total: number}} dados
 */
export function registrarPagamentoPendente(telefone, { link, total }) {
  if (!telefone || !link) return;
  pagamentosPendentes.set(telefone, {
    telefone,
    link,
    total: Number(total) || 0,
    criadoEm: Date.now(),
    lembreteEnviado: false,
  });
  console.log('[lembrete] pagamento pendente registrado', { telefone, total });
}

/**
 * Marca um pagamento como concluído/pago (remove dos pendentes).
 * Chamado pelo webhook do Mercado Pago quando o pagamento é aprovado.
 *
 * @param {string} telefone
 */
export function marcarPago(telefone) {
  if (pagamentosPendentes.delete(telefone)) {
    console.log('[lembrete] pagamento concluído, removido dos pendentes', { telefone });
  }
}

/**
 * Verifica e envia lembretes de PAGAMENTO pendente.
 */
async function verificarPagamentosPendentes(agora) {
  for (const [telefone, p] of pagamentosPendentes.entries()) {
    const idadeMin = (agora - p.criadoEm) / MINUTO;

    // Desiste após o tempo máximo (link provavelmente expirado).
    if (idadeMin >= EXPIRA_PAGAMENTO_MIN) {
      pagamentosPendentes.delete(telefone);
      continue;
    }

    // Envia um único lembrete após o tempo configurado.
    if (!p.lembreteEnviado && idadeMin >= LEMBRETE_PAGAMENTO_MIN) {
      try {
        await enviarBotaoUrlWhatsApp(telefone, {
          corpo: corpoLembretePagamento(p.total),
          textoBotao: 'Pagar agora',
          url: p.link,
          rodape: 'Pagamento seguro via Mercado Pago',
        });
        p.lembreteEnviado = true;
        console.log('[lembrete] lembrete de pagamento enviado', { telefone });
      } catch (e) {
        console.error('[lembrete] erro ao enviar lembrete de pagamento:', e.message);
      }
    }
  }
}

/**
 * Verifica e envia lembretes de CARRINHO abandonado (pedido não confirmado).
 */
async function verificarCarrinhosAbandonados(agora) {
  for (const sessao of listarSessoes()) {
    // Só interessa quem montou pedido e parou antes de pagar.
    const noMeioDoPedido =
      sessao.estado === ESTADOS.AGUARDANDO_CONFIRMACAO ||
      sessao.estado === ESTADOS.AGUARDANDO_SABORES_COMBO ||
      sessao.estado === ESTADOS.AGUARDANDO_ENDERECO;

    if (!noMeioDoPedido) continue;
    if (sessao.lembreteCarrinhoEnviado) continue;
    if (!sessao.carrinho?.length && !sessao.carrinhoBase?.length) continue;

    const inativoMin = (agora - sessao.atualizadoEm) / MINUTO;

    // Não incomoda cedo demais nem tarde demais (perto de expirar a sessão).
    if (inativoMin >= LEMBRETE_CARRINHO_MIN && inativoMin < EXPIRA_CARRINHO_MIN) {
      // Total: usa o do carrinho confirmado, ou estima pelo carrinho base.
      const total =
        sessao.total ||
        (sessao.carrinhoBase || []).reduce(
          (s, i) => s + i.produto.price * i.quantidade,
          0
        );
      try {
        await enviarMensagemWhatsApp(
          sessao.telefone,
          mensagemLembreteCarrinho(total)
        );
        // Marca direto no objeto para NÃO reiniciar o contador de inatividade.
        sessao.lembreteCarrinhoEnviado = true;
        console.log('[lembrete] lembrete de carrinho enviado', {
          telefone: sessao.telefone,
        });
      } catch (e) {
        console.error('[lembrete] erro ao enviar lembrete de carrinho:', e.message);
      }
    }
  }
}

/**
 * Executa uma rodada de verificação de lembretes.
 * Exportada para permitir disparo manual/externo (ex.: Cloud Scheduler).
 */
export async function executarVerificacaoLembretes() {
  const agora = Date.now();
  await verificarPagamentosPendentes(agora);
  await verificarCarrinhosAbandonados(agora);
}

/**
 * Inicia o agendador periódico (idempotente).
 * Chamado uma vez na subida da aplicação.
 */
export function iniciarAgendadorLembretes() {
  if (agendadorIniciado) return;
  agendadorIniciado = true;

  const intervalo = setInterval(() => {
    executarVerificacaoLembretes().catch(e =>
      console.error('[lembrete] erro na rodada de lembretes:', e.message)
    );
  }, MINUTO); // verifica a cada 1 minuto

  if (intervalo.unref) intervalo.unref();
  console.log('[lembrete] agendador de lembretes iniciado', {
    lembretePagamentoMin: LEMBRETE_PAGAMENTO_MIN,
    lembreteCarrinhoMin: LEMBRETE_CARRINHO_MIN,
  });
}

export default {
  registrarPagamentoPendente,
  marcarPago,
  executarVerificacaoLembretes,
  iniciarAgendadorLembretes,
};
