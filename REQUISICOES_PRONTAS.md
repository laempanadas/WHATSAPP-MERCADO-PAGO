# 📋 REQUISIÇÕES PRONTAS PARA TESTAR

Copie e cole cada requisição no terminal. Substitua valores como necessário.

---

## 🏥 HEALTH CHECK

### Verificar se servidor está vivo
```bash
curl -X GET http://localhost:8080/health
```

**Resposta esperada:**
```json
{"status":"ok"}
```

---

## ✔️ WEBHOOK WHATSAPP - GET (Validação)

### Meta envia isso para validar seu servidor
```bash
curl -X GET "http://localhost:8080/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=seu_token_aqui&hub.challenge=test_challenge_123"
```

**Resposta esperada:**
```
test_challenge_123
```

❗ **Substitua `seu_token_aqui` pelo valor em `.env VERIFY_TOKEN`**

---

## 💬 WEBHOOK WHATSAPP - POST (Mensagem de Texto)

### Simular alguém mandando mensagem "oi"
```bash
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "messages": [
              {
                "from": "5511997088839",
                "id": "wamid.123456",
                "timestamp": "1699564000",
                "text": {
                  "body": "oi"
                },
                "type": "text"
              }
            ],
            "contacts": [
              {
                "profile": {
                  "name": "João da Silva"
                },
                "wa_id": "5511997088839"
              }
            ]
          }
        }
      ]
    }
  ]
}'
```

**Resposta esperada:**
```
EVENT_RECEIVED
```

**Ver no console do servidor:**
```
POST /webhook/whatsapp recebido
GET /webhook/whatsapp recebido
Mensagem: oi
Resposta gerada...
```

---

## 🛒 WEBHOOK WHATSAPP - POST (Pedido do Catálogo)

### Simular alguém comprando 2 empanadas de carne
```bash
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "orders": [
              {
                "catalog_id": "12345",
                "product_items": [
                  {
                    "product_retailer_id": "carne",
                    "quantity": 2,
                    "item_price": 14.00,
                    "currency": "BRL"
                  }
                ],
                "text": "Quero 2 empanadas de carne",
                "from": "5511997088839",
                "id": "order_123",
                "timestamp": "1699564000"
              }
            ],
            "contacts": [
              {
                "profile": {
                  "name": "Maria"
                },
                "wa_id": "5511997088839"
              }
            ]
          }
        }
      ]
    }
  ]
}'
```

**Resposta esperada:**
```
EVENT_RECEIVED
```

**Ver no console:**
```
Pedido recebido
Total: R$ 28.00
Link de pagamento criado
Mensagem enviada ao cliente
```

---

## 💳 WEBHOOK MERCADO PAGO - POST (Pagamento Aprovado)

### Simular notificação de pagamento aprovado
```bash
curl -X POST http://localhost:8080/webhook/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
  "id": 1234567890,
  "type": "payment",
  "data": {
    "id": "987654321"
  },
  "action": "payment.approved"
}'
```

**Resposta esperada:**
```
EVENT_RECEIVED
```

**Ver no console:**
```
Webhook Mercado Pago recebido
action: payment.approved
Buscando informações do pagamento
Pagamento processado
Mensagens enviadas
```

---

## 📦 VARIAÇÕES: DIFERENTES MENSAGENS

### Pedido em texto (via chatbot)
```bash
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "messages": [
              {
                "from": "5511997088839",
                "id": "wamid.123456",
                "timestamp": "1699564000",
                "text": {
                  "body": "2 carne 1 cheeseburger"
                },
                "type": "text"
              }
            ],
            "contacts": [
              {
                "profile": {
                  "name": "Cliente"
                },
                "wa_id": "5511997088839"
              }
            ]
          }
        }
      ]
    }
  ]
}'
```

### Mensagem pedindo cardápio
```bash
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "messages": [
              {
                "from": "5511997088839",
                "id": "wamid.123456",
                "timestamp": "1699564000",
                "text": {
                  "body": "cardápio"
                },
                "type": "text"
              }
            ],
            "contacts": [
              {
                "profile": {
                  "name": "Maria"
                },
                "wa_id": "5511997088839"
              }
            ]
          }
        }
      ]
    }
  ]
}'
```

### Confirmação de pedido (mensagem "sim")
```bash
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "messages": [
              {
                "from": "5511997088839",
                "id": "wamid.123456",
                "timestamp": "1699564000",
                "text": {
                  "body": "sim"
                },
                "type": "text"
              }
            ],
            "contacts": [
              {
                "profile": {
                  "name": "Cliente"
                },
                "wa_id": "5511997088839"
              }
            ]
          }
        }
      ]
    }
  ]
}'
```

---

## 🔗 FAZER REQUISIÇÃO VÁRIOS NÚMEROS (TESTE DE CARGA)

```bash
for i in {1..5}; do
  echo "Teste $i..."
  curl -s -X POST http://localhost:8080/webhook/whatsapp \
    -H "Content-Type: application/json" \
    -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messaging_product":"whatsapp","messages":[{"from":"559912345'$i'","text":{"body":"oi"},"type":"text"}],"contacts":[{"wa_id":"559912345'$i'","profile":{"name":"User'$i'"}}]}}]}]}'
  sleep 1
done
```

---

## 💻 USAR COM POSTMAN / INSOMNIA

### Importar como cURL

Cada requisição acima pode ser importada no Postman:

1. Abra Postman
2. Clique em **"Import"**
3. Cole a requisição curl
4. Clique em **"Import"**
5. Altere valores conforme necessário
6. Clique em **"Send"**

---

## 🧵 TESTE COMPLETO: FLUXO DE COMPRA

Execute na ordem:

### 1️⃣ Cliente manda "oi"
```bash
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messaging_product":"whatsapp","messages":[{"from":"5511997088839","text":{"body":"oi"},"type":"text"}],"contacts":[{"wa_id":"5511997088839","profile":{"name":"Cliente"}}]}}]}]}'
```

**Aguarde ~2 segundos**

### 2️⃣ Cliente manda pedido
```bash
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messaging_product":"whatsapp","messages":[{"from":"5511997088839","text":{"body":"2 carne"},"type":"text"}],"contacts":[{"wa_id":"5511997088839","profile":{"name":"Cliente"}}]}}]}]}'
```

**Aguarde ~2 segundos**

### 3️⃣ Cliente confirma "sim"
```bash
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messaging_product":"whatsapp","messages":[{"from":"5511997088839","text":{"body":"sim"},"type":"text"}],"contacts":[{"wa_id":"5511997088839","profile":{"name":"Cliente"}}]}}]}]}'
```

**Aguarde ~3 segundos - deve receber link de pagamento nos logs**

### 4️⃣ Simular pagamento aprovado
```bash
curl -X POST http://localhost:8080/webhook/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"id":1234567890,"type":"payment","data":{"id":"987654321"},"action":"payment.approved"}'
```

**Aguarde ~2 segundos - deve receber confirmação**

---

## 🔎 MONITORAR REQUISIÇÕES EM TEMPO REAL

### Terminal 1: Servidor
```bash
npm run dev 2>&1 | tee logs.txt
```

### Terminal 2: Requisições + Logs
```bash
# Rodar teste
./test_api_local.sh

# Depois verificar logs
tail -100 logs.txt
```

### Terminal 3: Monitorar requisições HTTP (Linux)
```bash
sudo tcpdump -i lo -n 'tcp port 8080' -A | grep -E '^[^[:space:]]|POST|GET|{.*}'
```

---

## 📊 TABELA DE MÉTODOS E ENDPOINTS

| Método | Endpoint | GET | POST | Descrição |
|--------|----------|-----|------|-----------|
| GET | `/health` | ✅ | ❌ | Health check |
| GET | `/webhook/whatsapp` | ✅ | ❌ | Validação webhook Meta |
| POST | `/webhook/whatsapp` | ❌ | ✅ | Receber mensagens/pedidos |
| POST | `/webhook/mercadopago` | ❌ | ✅ | Notificação pagamento |

---

## ✅ CHECKLIST DE TESTES

- [ ] Health Check responde
- [ ] Webhook GET retorna challenge
- [ ] Webhook POST retorna EVENT_RECEIVED
- [ ] Servidor processa mensagens (ver nos logs)
- [ ] Servidor envia respostas (ver nos logs)
- [ ] Tokens funcionam (sem erro 401)
- [ ] Fluxo completo: oi → pedido → sim → pagamento → confirmação

