# ⚙️ Configuração de Webhooks - Passo a Passo

## 📍 Localização no Painel Meta

A Meta informou que sua WABA (`1749718309791164`) está **ativa e verificada**, mas os webhooks estão incompletos.

Para resolver:

1. Acesse: [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Selecione seu app
3. Navegue para: **Casos de uso > Personalizar > Conectar no WhatsApp > Configuração básica**
4. Vá para: **Etapa 2: Configuração de produção > Configurar webhooks**

---

## ✅ Campos Obrigatórios

Certifique-se de que os seguintes campos estão **HABILITADOS**:

### Para Mensagens (Messages)
- ☑️ `messages` — Receber mensagens de clientes
- ☑️ `delivery` — Status de entrega (enviada, entregue, lida)
- ☑️ `read` — Status de mensagens lidas

### Para Pedidos do Catálogo (Orders)  
- ☑️ `orders` — Pedidos via botão "Comprar" do catálogo
- ☑️ `order_status` — Atualizações de status do pedido

---

## 🔗 URL do Webhook

Configure com:
```
https://seu-app.run.app/webhook/whatsapp
```

**Substitua `seu-app.run.app` pela URL real do seu Google Cloud Run.**

---

## 🔐 Token de Verificação

Use o token configurado em `.env`:
```
VERIFY_TOKEN=seu_token_de_verificacao
```

---

## 📋 Checklist de Configuração

| Campo | Status | Detalhes |
|-------|--------|----------|
| URL do Webhook | ✅ Implementado | `/webhook/whatsapp` |
| Messages | ✅ Processado | Recebe e responde |
| Delivery Status | ✅ Processado | Registra eventos |
| Orders (Catálogo) | ✅ Processado | Integrado com Mercado Pago |
| Token de Verificação | ⚠️ Verificar | Deve estar no `.env` |

---

## 🚀 Após Ativar os Webhooks

1. Salve a configuração no painel da Meta
2. Aguarde a confirmação (pode levar alguns minutos)
3. Teste enviando uma mensagem para o número do WhatsApp
4. Verifique os logs do Cloud Run para confirmar que o webhook foi acionado

---

## 📊 Resposta Esperada do Webhook

Quando tudo está configurado corretamente, o webhook retorna:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1749718309791164",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "messages": [
              {
                "from": "5511987654321",
                "id": "wamid.xxx",
                "timestamp": "1699564000",
                "text": {
                  "body": "Olá!"
                },
                "type": "text"
              }
            ],
            "contacts": [
              {
                "profile": {
                  "name": "Cliente"
                },
                "wa_id": "5511987654321"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

---

## ❓ Dúvidas

Se a Meta não reconhecer o webhook após ativar:

1. Verifique se a URL é **HTTPS** (não HTTP)
2. Confirme que o `VERIFY_TOKEN` no `.env` é exatamente igual ao painel
3. Teste manualmente enviando uma mensagem para o número
4. Verifique os logs: `gcloud run logs read whatsappmercadopago --limit=50`

