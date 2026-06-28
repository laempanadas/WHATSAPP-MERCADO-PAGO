import express from 'express';
import healthRoutes from './routes/health.js';
import webhookWhatsAppRoutes from './routes/webhook.whatsapp.js';
import webhookMercadoPagoRoutes from './routes/webhook.mercadopago.js';
import checkoutRoutes from './routes/checkout.js';
import { iniciarAgendadorLembretes } from './services/lembrete.service.js';

const app = express();

app.use(express.json());

app.use('/', healthRoutes);
app.use('/', webhookWhatsAppRoutes);
app.use('/', webhookMercadoPagoRoutes);
app.use('/', checkoutRoutes);

// Middleware centralizado de tratamento de erros.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ erro: 'Erro interno ao processar a solicitação.' });
});

// Inicia o agendador que envia lembretes automáticos de pagamento pendente
// e de carrinho abandonado. É idempotente: só cria um intervalo, mesmo que
// o módulo seja importado mais de uma vez.
iniciarAgendadorLembretes();

export default app;
