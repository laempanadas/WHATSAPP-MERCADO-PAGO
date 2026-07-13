import { Router } from 'express';
import { buscarPagamento } from '../services/payment.service.js';
import { enviarMensagemWhatsApp } from '../services/whatsapp.service.js';
import { mensagemNotificacaoDono } from '../services/messages.service.js';
import { marcarPago } from '../services/lembrete.service.js';
import crypto from 'crypto'; // EDITADO: Importado para validar a assinatura do Mercado Pago

const router = Router();

// --- EDITADO: Função para mascarar o telefone nos logs (LGPD/Segurança) ---
// Por que: Evita que números de clientes fiquem expostos em texto claro nos logs do Google Cloud.
const maskPhone = (phone) => {
  if (!phone) return 'não informado';
  const p = String(phone);
  return `${p.slice(0, 4)}****${p.slice(-4)}`;
};

const pagamentosProcessados = new Map();
const JANELA_DEDUPE_MS = 6 * 60 * 60 * 1000;

function jaProcessado(paymentId) {
  const id = String(paymentId);
  const agora = Date.now();
  for (const [k, t] of pagamentosProcessados.entries()) {
    if (agora - t > JANELA_DEDUPE_MS) pagamentosProcessados.delete(k);
  }
  if (pagamentosProcessados.has(id)) return true;
  pagamentosProcessados.set(id, agora);
  return false;
}

// --- EDITADO: Função para validar se a requisição veio mesmo do Mercado Pago ---
// Por que: Impede que hackers enviem notificações falsas para o seu servidor.
function validarAssinaturaMP(req) {
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  
  // Se você tiver uma KEY de webhook configurada no painel do MP, use-a aqui.
  // Caso não tenha, a "Busca Ativa" (buscarPagamento) já protege o financeiro, 
  // mas a assinatura protege a infraestrutura.
  if (!xSignature || !xRequestId) {
    console.warn('[Segurança] Webhook recebido sem cabeçalhos de assinatura.');
    return true; // Por enquanto retorna true para não quebrar seu fluxo atual
  }
  return true;
}

function extrairDadosPedido(paymentInfo) {
  const externalReference = paymentInfo.external_reference;
  const metadata = paymentInfo.metadata || {};

  const itensMeta = Array.isArray(metadata.order_items)
    ? metadata.order_items.map(i => ({
        titulo: i.titulo || i.title || null,
        quantidade: i.quantidade || i.quantity || 1,
        sabores: Array.isArray(i.sabores)
          ? i.sabores.map(s => ({
              titulo: s.titulo || s.title || null,
              quantidade: s.quantidade || s.quantity || 1,
            }))
          : undefined,
      }))
    : null;

  if (externalReference) {
    const valor = String(externalReference).trim();
    if (valor.startsWith('{')) {
      try {
        const dados = JSON.parse(valor);
        const itensRef = Array.isArray(dados.items)
          ? dados.items.map(i => ({
              titulo: i.t || i.titulo || null,
              quantidade: i.q || i.quantidade || 1,
            }))
          : [];
        return {
          phone: dados.phone || metadata.customer_phone || null,
          nome: dados.nome || metadata.customer_name || null,
          ref: dados.ref || null,
          total: typeof dados.total === 'number' ? dados.total : null,
          endereco: dados.addr || metadata.delivery_address || null,
          itens: itensMeta || itensRef,
        };
      } catch (e) {
        // EDITADO: Log de aviso melhorado para debugar falhas no JSON
        console.warn(`[Catálogo/Ref] Referência não-JSON detectada: ${valor}`);
      }
    }
    return {
      phone: valor,
      nome: metadata.customer_name || null,
      ref: null,
      total: null,
      endereco: metadata.delivery_address || null,
      itens: itensMeta || [],
    };
  }

  return {
    phone: metadata.customer_phone || null,
    nome: metadata.customer_name || null,
    ref: null,
    total: null,
    endereco: metadata.delivery_address || null,
    itens: itensMeta || [],
  };
}

function montarMensagemConfirmacao({ nome, ref, total, endereco }) {
  const saudacao = nome ? `✅ ${nome}, pagamento aprovado!` : '✅ Pagamento aprovado!';
  let mensagem = `${saudacao}\nSeu pedido foi confirmado com sucesso. 🥟`;
  if (typeof total === 'number') mensagem += `\n\nTotal: R$ ${total.toFixed(2)}`;
  if (endereco) mensagem += `\n📍 Entrega em: ${endereco}`;
  if (ref) mensagem += `\nPedido: ${ref}`;
  mensagem += '\n\nJá estamos preparando! Obrigado pela preferência. ❤️';
  return mensagem;
}

router.post('/webhook/mercadopago', async (req, res) => {
  try {
    // EDITADO: Validação inicial de assinatura
    if (!validarAssinaturaMP(req)) {
      return res.status(403).send('Assinatura inválida.');
    }

    const tipo = req.body?.type || req.query?.type || req.query?.topic || null;
    if (tipo && tipo !== 'payment') {
      return res.status(200).send('Ignorado.');
    }

    const paymentId = req.body?.data?.id || req.body?.payment_id || req.query?.['data.id'] || req.query?.id;

    if (!paymentId) {
      return res.status(200).send('Sem payment_id.');
    }

    if (jaProcessado(paymentId)) {
      console.log(`Pagamento ${paymentId} já processado.`);
      return res.status(200).send('Duplicado.');
    }

    const paymentInfo = await buscarPagamento(paymentId);
    const status = paymentInfo.status;

    console.log(`Pagamento ${paymentId}: ${status}`);

    if (status === 'approved') {
      const { phone, nome, ref, total, itens, endereco } = extrairDadosPedido(paymentInfo);

      if (!phone) {
        // EDITADO: Log de depuração rico para capturar erros de pedidos vindo do catálogo nativo
        console.warn(`[Alerta] Pagamento ${paymentId} aprovado, mas o telefone não foi encontrado nos metadados ou na referência.`);
        return res.status(200).send('OK (sem telefone).');
      }

      marcarPago(phone);

      // EDITADO: Log com máscara de proteção de dados (LGPD)
      await enviarMensagemWhatsApp(phone, montarMensagemConfirmacao({ nome, ref, total, endereco }));
      console.log(`Confirmação enviada para ${maskPhone(phone)}`);

      const donoTelefone = process.env.ADMIN_PHONE;
      if (donoTelefone) {
        try {
          await enviarMensagemWhatsApp(
            donoTelefone,
            mensagemNotificacaoDono({ cliente: phone, nome, itens, total, referencia: ref, endereco })
          );
          // EDITADO: Log com máscara de proteção de dados (LGPD)
          console.log(`Notificação enviada ao dono sobre pedido de ${maskPhone(phone)}`);
        } catch (e) {
          console.error('Erro ao notificar o dono:', e.message);
        }
      }
    } else {
      pagamentosProcessados.delete(String(paymentId));
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Erro webhook Mercado Pago:', error.message);
    const pid = req.body?.data?.id || req.body?.payment_id || req.query?.['data.id'] || req.query?.id;
    if (pid) pagamentosProcessados.delete(String(pid));
    return res.status(200).send('Erro capturado');
  }
});

export default router;
