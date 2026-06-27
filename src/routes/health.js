import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).send('Servidor WhatsApp + Mercado Pago ONLINE!');
});

router.get('/pagamento/sucesso', (req, res) => {
  res.send('Pagamento aprovado.');
});

router.get('/pagamento/erro', (req, res) => {
  res.send('Pagamento recusado.');
});

router.get('/pagamento/pendente', (req, res) => {
  res.send('Pagamento pendente.');
});

export default router;