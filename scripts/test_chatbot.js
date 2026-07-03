import { processarMensagemTexto } from '../src/services/chatbot.service.js';

async function run() {
  const telefone = '5511997088839';
  const mensagens = [
    'tem de costela hoje',
    'Amiga tem de costela hoje',
    '2 costela',
    'Boa Noite',
  ];

  for (const msg of mensagens) {
    const resp = await processarMensagemTexto(telefone, msg, 'Fabi');
    console.log('---');
    console.log('Mensagem:', msg);
    console.log('Resposta:', resp);
  }
  console.log('Teste chatbot concluído.');
}

run().catch(e => console.error(e));
