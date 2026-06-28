# 🥟 WhatsApp + Mercado Pago - Bot de Empanadas

Sistema completo de atendimento automatizado via WhatsApp com pagamento pelo Mercado Pago.

## 🚀 Funcionalidades

### ✅ Já Implementado

- **Bot conversacional por texto** — cliente conversa naturalmente ("2 carne 1 cheeseburger")
- **Detecção inteligente de intenções** — saudação, pedido, confirmação, cancelamento, ajuda
- **Reconhecimento de produtos** — entende variações ("duas de frango", "cheeseburger", "carne")
- **Carrinho de compras** — mantém estado da conversa por cliente
- **Pagamento Mercado Pago** — geração automática de link de pagamento
- **Catálogo do Commerce Manager** — integração com Meta Commerce para pedidos via botão "Comprar"
- **Confirmação automática** — cliente recebe confirmação no WhatsApp após pagamento
- **Notificação ao dono** — aviso automático quando pedido é pago (configurável via `ADMIN_PHONE`)

### 📦 Arquitetura

```
src/
├── config/          # Configuração Mercado Pago e WhatsApp
├── data/            # Catálogo de produtos (mock)
├── routes/          # Endpoints (checkout, webhooks)
├── services/        # Lógica de negócio
│   ├── nlp.service.js           # Processamento de linguagem natural
│   ├── conversation.service.js  # Gerenciamento de sessões/carrinho
│   ├── chatbot.service.js       # Orquestração do bot
│   ├── messages.service.js      # Templates de mensagem
│   ├── payment.service.js       # Mercado Pago
│   └── whatsapp.service.js      # Envio de mensagens
└── utils/           # Utilitários (cálculos, etc.)
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente (Cloud Run)

Configure as seguintes variáveis no Google Cloud Run:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `MP_ACCESS_TOKEN` | Access Token do Mercado Pago | `APP_USR-...` |
| `WA_TOKEN` | Token da WhatsApp Business API | `EAAxxxxxx...` |
| `PHONE_NUMBER_ID` | ID do número do WhatsApp | `123456789` |
| `VERIFY_TOKEN` | Token de verificação do webhook | `meu_token_secreto` |
| `BASE_URL` | URL pública do Cloud Run | `https://seu-app.run.app` |
| `ADMIN_PHONE` | *(opcional)* Telefone do dono para notificações | `5511959480047` |

Veja `.env.example` para referência.

---

### 2. Configurar Webhooks na Meta

#### WhatsApp Business API
1. Acesse: [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Selecione seu app → WhatsApp → Configuração
3. Em **Webhooks**, configure:
   - **URL do callback:** `https://seu-app.run.app/webhook/whatsapp`
   - **Token de verificação:** o mesmo valor de `VERIFY_TOKEN`
   - **Campos inscritos:** `messages` ✅

#### Mercado Pago
1. Acesse: [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers/panel)
2. Vá em **Webhooks** → Adicionar
3. URL: `https://seu-app.run.app/webhook/mercadopago`
4. Eventos: `payment` ✅

---

### 3. Configurar URL de Checkout (Meta Commerce Manager)

1. Acesse: [business.facebook.com/commerce](https://business.facebook.com/commerce)
2. Selecione sua loja → Configurações → Detalhes da loja
3. Em **URL de finalização da compra**, configure:
   ```
   https://seu-app.run.app/checkout?product_id={product.retailer_id}&quantity={product.quantity}
   ```

---

## 🧪 Como Testar

### Teste Local (desenvolvimento)
```bash
# 1. Clone o repositório
git clone https://github.com/laempanadas/WHATSAPP-MERCADO-PAGO.git
cd WHATSAPP-MERCADO-PAGO

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com seus tokens reais

# 3. Instale dependências
npm install

# 4. Inicie o servidor
npm start
```

### Teste no WhatsApp (produção)

1. **Adicione o número da loja no WhatsApp:**
   - Número: `+55 11 2669-0644`
   - Ou use o link direto: [wa.me/551126690644](https://wa.me/551126690644)

2. **Mande uma mensagem de teste:**
   ```
   Cliente: oi
   Bot: [mostra cardápio]
   
   Cliente: 2 carne 1 cheeseburger
   Bot: [mostra total e pede confirmação]
   
   Cliente: sim
   Bot: [envia link de pagamento]
   ```

---

## 📱 Links Úteis para Clientes

Use este link para compartilhar com clientes (já abre no WhatsApp):
```
https://wa.me/551126690644?text=Oi!%20Quero%20fazer%20um%20pedido
```

QR Code (escaneie para abrir no WhatsApp):
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://wa.me/551126690644
```

Veja `INSTRUCOES_CLIENTE.md` para material de divulgação pronto.

---

## 🔧 Deploy

O projeto está configurado para deploy automático no **Google Cloud Run** via GitHub. Qualquer push na branch `main` aciona o redeploy.

Para deploy manual:
```bash
gcloud run deploy whatsappmercadopago \
  --source . \
  --region southamerica-east1 \
  --platform managed
```

---

## 📊 Próximas Melhorias

- [ ] Painel de pedidos (Google Sheets ou dashboard web)
- [ ] Histórico de conversas persistente (Redis/Firestore)
- [ ] Múltiplos produtos e variações de preço
- [ ] Integração com sistema de delivery
- [ ] Relatórios de vendas e analytics

---

## 📄 Licença

Projeto privado - La Empanadas Saltenhas Argentinas

---

## 🆘 Suporte

- Documentação WhatsApp Business API: [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- Documentação Mercado Pago: [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
