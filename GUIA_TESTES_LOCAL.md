# 🧪 GUIA COMPLETO: TESTAR LOCAL E DIAGNOSTICAR PROBLEMAS DE POST

## 🔴 PROBLEMA: Fluxo parou, POST não chega à cloud, sem erros visíveis

---

## 1️⃣ VERIFICAR VARIÁVEIS DE AMBIENTE

### Passo 1: Verificar arquivo `.env`
```bash
cat .env
```

**OBRIGATÓRIAS:**
```
PORT=8080
BASE_URL=http://localhost:8080    # ❌ Para TESTAR LOCAL
BASE_URL=https://seu-dominio.com   # ✅ Para CLOUD

PHONE_NUMBER_ID=seu_numero_whatsapp_id
WA_TOKEN=seu_token_whatsapp
VERIFY_TOKEN=seu_token_verificacao

MP_ACCESS_TOKEN=seu_token_mercado_pago
MP_PUBLIC_KEY=sua_chave_publica_mercado_pago
```

❌ **CAUSA COMUM #1: BASE_URL errada**
- Se estiver apontando para `localhost` enquanto tenta funcionar na cloud → POST não chega
- Se estiver apontando para `https://seu-dominio.com` enquanto testa local → webhook validação falha

---

## 2️⃣ INICIAR SERVIDOR LOCAL

### Opção A: Com nodemon (recarrega automaticamente)
```bash
npm run dev
```

**Esperar aparecer:**
```
🚀 Servidor rodando na porta 8080
```

### Opção B: Modo produção simples
```bash
npm start
```

---

## 3️⃣ TESTAR SE O SERVIDOR ESTÁ VIVO

### Health Check (endpoint `/health`)
```bash
curl -X GET http://localhost:8080/health
```

**Resposta esperada:**
```json
{"status":"ok"}
```

❌ **Se retornar erro:** Servidor não está respondendo
- Verifique se está rodando em background
- Verifique porta 8080 está disponível: `lsof -i :8080`

---

## 4️⃣ TESTAR WEBHOOK WHATSAPP (GET - Validação)

### O que faz:
Meta/WhatsApp envia GET para **validar** que seu servidor existe

### Testar localmente:
```bash
curl -X GET "http://localhost:8080/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=SEU_VERIFY_TOKEN&hub.challenge=test_challenge_123"
```

**Resposta esperada (retorna o challenge):**
```
test_challenge_123
```

❌ **Se retornar erro 403:**
- `VERIFY_TOKEN` está errado no `.env`
- `hub.verify_token` na requisição não combina com `.env`

---

## 5️⃣ TESTAR WEBHOOK WHATSAPP (POST - Mensagem/Pedido)

### O que faz:
Quando alguém manda mensagem no WhatsApp, Meta envia POST com dados

### Simular uma mensagem de texto:
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
                    "name": "João"
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

**Resposta esperada (IMEDIATA):**
```
EVENT_RECEIVED
```

**Verifique no console do servidor:**
```
GET /webhook/whatsapp recebido
Bot responde: oi
Mensagem enviada via WhatsApp API
```

---

## 6️⃣ SIMULAR PEDIDO DO CATÁLOGO WHATSAPP

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
                  "text": "Pedido do catálogo",
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

**Verifique no console:** Link de pagamento criado

---

## 7️⃣ TESTAR WEBHOOK MERCADO PAGO (POST - Confirmação Pagamento)

### O que faz:
Quando pagamento é confirmado, Mercado Pago envia POST

### Simular pagamento confirmado:
```bash
curl -X POST http://localhost:8080/webhook/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123456789,
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

**Verifique no console:**
```
Webhook Mercado Pago recebido
Pagamento processado: ID 987654321
Mensagem confirmação enviada ao cliente
```

---

## 8️⃣ TESTAR FLUXO COMPLETO (DO INÍCIO AO FIM)

### Passo A: Iniciar servidor
```bash
npm run dev
```

### Passo B: Fazer requisição de pedido
```bash
# 1. Simular mensagem "sim" (confirmar pedido)
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"id":"123456","changes":[{"value":{"messaging_product":"whatsapp","messages":[{"from":"5511997088839","id":"wamid.123456","timestamp":"1699564000","text":{"body":"sim"},"type":"text"}],"contacts":[{"profile":{"name":"Cliente"},"wa_id":"5511997088839"}]}}]}]}'
```

### Passo C: Confirmar que link foi gerado
- Procure no console: `Link de pagamento criado`
- Procure no console: mensagem com link iniciando com `https://mercadopago.com`

---

## 9️⃣ DIAGNOSTICAR: POR QUE POST NÃO CHEGA

### ❌ Checklist de Problemas Comuns

#### 1. **Servidor não está rodando**
```bash
curl -X GET http://localhost:8080/health
```
- ❌ Se não responder → `npm run dev`

#### 2. **BASE_URL está errada no .env**
```bash
cat .env | grep BASE_URL
```
- ❌ Se apontar para localhost enquanto testa produção
- ❌ Se apontar para https://seu-dominio enquanto testa local

#### 3. **Tokens estão expirados ou errados**
```bash
cat .env | grep TOKEN
```
- Verifique em:
  - [Meta/WhatsApp Business](https://developers.facebook.com)
  - [Mercado Pago Dashboard](https://www.mercadopago.com.br/admin)

#### 4. **Porta 8080 bloqueada**
```bash
lsof -i :8080
```
- Se ocupada, mude em `.env`: `PORT=9000`

#### 5. **Firewall/Rede bloqueando POST**
```bash
# Testar se consegue fazer POST (não GET)
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```
- ❌ Se não responder → Firewall está bloqueando
- ✅ Se responder 200 → Rede OK

#### 6. **Webhook não está registrado em Meta/WhatsApp**
- Vá em [Meta App Dashboard](https://developers.facebook.com)
- Verifique Webhook URL está configurada como: `https://seu-dominio.com/webhook/whatsapp` (com HTTPS!)
- Verifique Verify Token combina com `.env VERIFY_TOKEN`
- Verifique eventos (messages, orders) estão marcados

---

## 🔟 TESTAR NA CLOUD

### Passo 1: Atualizar BASE_URL no `.env`
```env
BASE_URL=https://seu-dominio.com  # ✅ HTTPS obrigatório
```

### Passo 2: Fazer deploy
```bash
git push  # Se usar automático
# OU
ssh user@seu-servidor "cd /app && git pull && npm install && npm start"
```

### Passo 3: Verificar logs do servidor
```bash
# SSH para servidor
ssh user@seu-servidor

# Ver últimas mensagens
tail -f logs/app.log
# OU ver via PM2
pm2 logs
```

### Passo 4: Testar se servidor está vivo
```bash
curl -X GET https://seu-dominio.com/health
```

**Resposta esperada:**
```json
{"status":"ok"}
```

### Passo 5: Verificar webhook em Meta/WhatsApp
- Dashboard → App Settings → Webhooks
- Clique em "Test Webhook" ou "Verify Webhook"
- Deve retornar ✅ Verified

---

## 1️⃣1️⃣ LOGS E DEBUG

### Ver logs em TEMPO REAL (Local)
```bash
npm run dev 2>&1 | tee logs.txt
```

### Ver histórico de requisições
```bash
cat logs.txt | grep webhook
cat logs.txt | grep Erro
```

### Ver requisições HTTP específicas
```bash
# Instalar tcpdump se não tiver
sudo apt install tcpdump

# Monitorar porta 8080
sudo tcpdump -i lo -A 'tcp port 8080'
```

### Debug avançado: Express middleware
No arquivo `src/app.js`, adicione logging:
```javascript
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});
```

---

## 1️⃣2️⃣ RESUMO RÁPIDO: FLUXO DO PROBLEMA

```
┌─────────────────────────────────────────────────────────┐
│ USUÁRIO ENVIA MENSAGEM NO WHATSAPP                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ META ENVIA POST PARA: https://seu-dominio.com/webhook/wa│
│ (⚠️ Deve ser HTTPS!)                                    │
└────────────────────┬────────────────────────────────────┘
                     │
         ❌ POR QUE FALHA AQUI?
         ├─ Domain não resolve
         ├─ Firewall bloqueia
         ├─ Certificado SSL inválido
         ├─ Servidor offline
         └─ Endpoint errado
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ SERVIDOR RECEBE E RESPONDE IMEDIATAMENTE: 200 OK       │
│ + "EVENT_RECEIVED"                                      │
└────────────────────┬────────────────────────────────────┘
                     │
        ✅ Se não responder em 5s,
        Meta reenvia (webhook retry)
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ SERVIDOR PROCESSA MENSAGEM EM BACKGROUND               │
│ (Pode demorar vários segundos)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ SERVIDOR ENVIA POST PARA WHATSAPP API:                  │
│ https://graph.instagram.com/v18.0/..../messages        │
│ (Com token WA_TOKEN)                                    │
└────────────────────┬────────────────────────────────────┘
                     │
         ❌ POR QUE FALHA AQUI?
         ├─ WA_TOKEN expirado/inválido
         ├─ PHONE_NUMBER_ID incorreto
         └─ Limite de taxa (rate limit)
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ ✅ MENSAGEM ENVIADA PARA O USUÁRIO NO WHATSAPP        │
└─────────────────────────────────────────────────────────┘
```

---

## 1️⃣3️⃣ COMANDO PARA TESTAR TUDO DE UMA VEZ

```bash
#!/bin/bash
echo "🧪 TESTE COMPLETO"

echo "1️⃣ Health check..."
curl -s http://localhost:8080/health

echo -e "\n2️⃣ Webhook validação..."
curl -s "http://localhost:8080/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=seu_token&hub.challenge=test"

echo -e "\n3️⃣ Webhook POST (mensagem)..."
curl -s -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messaging_product":"whatsapp","messages":[{"from":"5511997088839","text":{"body":"teste"},"type":"text"}],"contacts":[{"wa_id":"5511997088839","profile":{"name":"Teste"}}]}}]}]}'

echo -e "\n✅ TESTES CONCLUÍDOS"
```

Salve como `test_all.sh` e execute:
```bash
chmod +x test_all.sh
./test_all.sh
```

---

## 📞 PROXIMOS PASSOS

1. **Rode os testes acima** e compartilhe a saída do console
2. **Verifique BASE_URL** - é a causa mais comum!
3. **Verifique tokens** - expiram com frequência
4. **Verifique domínio** - certificado SSL válido?
5. **Teste localmente primeiro** depois tente em produção
