import { detectarIntencao, extrairItens } from '../src/services/nlp.service.js';
import { buscarProdutoPorTermo } from '../src/data/products.js';

const mensagens = [
  'tem de costela hoje',
  'Amiga tem de costela hoje',
  '2 costela',
  'Boa Noite',
  '????',
];

for (const msg of mensagens) {
  const intencao = detectarIntencao(msg);
  const itens = extrairItens(msg);
  const termoSimples = msg.replace(/\d+/g, '').trim();
  const produto = buscarProdutoPorTermo(termoSimples);

  console.log('---');
  console.log('Mensagem:', msg);
  console.log('Intenção:', intencao);
  console.log('Itens extraídos:', JSON.stringify(itens));
  console.log('Buscar produto por termo (limpo):', produto ? produto.produto.title : null);
}

console.log('Teste concluído.');
