import express from 'express';
import healthRoutes from './routes/health.js';
import webhookWhatsAppRoutes from './routes/webhook.whatsapp.js';
import webhookMercadoPagoRoutes from './routes/webhook.mercadopago.js';

const app = express();

app.use(express.json());

app.use('/', healthRoutes);
app.use('/', webhookWhatsAppRoutes);
app.use('/', webhookMercadoPagoRoutes);

export default app;