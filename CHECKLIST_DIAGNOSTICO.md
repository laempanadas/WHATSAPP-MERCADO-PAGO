# ✅ CHECKLIST RÁPIDO: DIAGNOSTICAR POR QUE FLUXO PAROU

## 🚀 PASSO 1: VERIFICAR VARIÁVEIS DE AMBIENTE

```bash
cat .env | grep -E "^(PORT|BASE_URL|VERIFY_TOKEN|WA_TOKEN|PHONE_NUMBER_ID|MP_)"
```

### ✅ Todos devem estar preenchidos:
- [ ] `PORT` = 8080 (ou número disponível)
- [ ] `BASE_URL` = http://localhost:8080 (LOCAL) ou https://seu-dominio.com (CLOUD)
- [ ] `VERIFY_TOKEN` = algum token (ex: "meu_token_secreto_123")
- [ ] `WA_TOKEN` = token Meta/WhatsApp (começa com EAA...)
- [ ] `PHONE_NUMBER_ID` = ID numérico do seu número WhatsApp
- [ ] `MP_ACCESS_TOKEN` = token Mercado Pago (começa com APP_USR...)
- [ ] `MP_PUBLIC_KEY` = chave pública MP (começa com APP_USR...)

**❌ CAUSA #1:** Se algum estiver vazio → POST não funciona

---

## 🏃 PASSO 2: INICIAR SERVIDOR

```bash
npm run dev
```

**Espere aparecer:**
```
🚀 Servidor rodando na porta 8080
```

**❌ Se não aparecer:**
```bash
# Verificar porta ocupada
lsof -i :8080

# Se ocupada, mude PORT no .env e tente novamente
PORT=9000 npm run dev
```

---

## 🧪 PASSO 3: RODAR SCRIPT DE TESTES

```bash
chmod +x test_api_local.sh
./test_api_local.sh
```

**Espere todos os testes passarem (✅)**

**Se algum falhar (❌):**
- [ ] Health Check falhou → Servidor offline
- [ ] Webhook GET falhou → VERIFY_TOKEN está errado
- [ ] Webhook POST falhou → Payload malformado ou erro de processamento

---

## 🔍 PASSO 4: VERIFICAR LOGS

### Ver logs em TEMPO REAL
```bash
npm run dev 2>&1 | tee logs.txt
```

### Procurar por erros
```bash
cat logs.txt | grep -i erro
cat logs.txt | grep -i failed
cat logs.txt | grep -i reject
```

### Procurar por sucesso
```bash
cat logs.txt | grep "Mensagem enviada"
cat logs.txt | grep "Pagamento processado"
```

---

## 🌐 PASSO 5: VERIFICAR TOKENS

### WhatsApp Token expirou?
1. Vá para [Meta App Dashboard](https://developers.facebook.com)
2. App → WhatsApp → Configuration
3. Copie novo token
4. Atualize `.env`: `WA_TOKEN=EAA...`
5. Reinicie: `npm run dev`

### Mercado Pago Token expirou?
1. Vá para [Mercado Pago](https://www.mercadopago.com.br/admin)
2. Configurações → Credenciais de teste/produção
3. Copie novo token
4. Atualize `.env`: `MP_ACCESS_TOKEN=APP_USR...`
5. Reinicie: `npm run dev`

---

## ⚠️ PASSO 6: VERIFICAR FIREWALL/REDE

### Porta 8080 está bloqueada?
```bash
# Testar conexão local
curl -X GET http://localhost:8080/health

# Esperar: {"status":"ok"}
```

**❌ Se não responder:**
- Servidor não está rodando
- Porta bloqueada pelo SO

### Domínio resolve?
```bash
nslookup seu-dominio.com

# Ou
ping seu-dominio.com
```

**❌ Se não responder:** Domínio não está registrado/resolvendo

### Certificado SSL é válido?
```bash
curl -I https://seu-dominio.com/health

# Esperar: HTTP/2 200
# ❌ Se retornar erro SSL: Certificado inválido
```

---

## 🐛 PASSO 7: DEBUG DETALHADO

### Habilitar logs no código

Abra `src/app.js` e adicione:

```javascript
// Após app.use(express.json());
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}]`);
  console.log(`📨 ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Adicione também após a rota de webhook whatsapp POST:
app.use((req, res, next) => {
  const oldJson = res.json;
  res.json = function(data) {
    console.log(`📤 Response: ${res.statusCode}`, data);
    return oldJson.call(this, data);
  };
  next();
});
```

### Monitorar requisições HTTP em tempo real
```bash
sudo tcpdump -i lo -A 'tcp port 8080' -w capture.pcap

# Em outro terminal
tcpdump -r capture.pcap -A | grep -E 'POST|GET|Content|body'
```

---

## 🎯 PASSO 8: TESTAR MANUALMENTE CADA PARTE

### 1. Health Check
```bash
curl http://localhost:8080/health
# Esperar: {"status":"ok"}
```

### 2. Validação Webhook (Meta envia GET)
```bash
curl "http://localhost:8080/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=test123"
# Esperar: test123
```

### 3. Mensagem de Texto
```bash
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messaging_product":"whatsapp","messages":[{"from":"5511997088839","text":{"body":"oi"},"type":"text"}],"contacts":[{"wa_id":"5511997088839","profile":{"name":"Teste"}}]}}]}]}'
# Esperar: EVENT_RECEIVED
```

### 4. Pedido do Catálogo
```bash
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messaging_product":"whatsapp","orders":[{"catalog_id":"12345","product_items":[{"product_retailer_id":"carne","quantity":2}],"from":"5511997088839","id":"order_123","timestamp":"1699564000"}],"contacts":[{"wa_id":"5511997088839","profile":{"name":"Maria"}}]}}]}]}'
# Esperar: EVENT_RECEIVED
```

---

## 📊 FLUXOGRAMA DE DIAGNÓSTICO

```
┌─ SERVIDOR RODANDO?
│  ├─ SIM → Próximo
│  └─ NÃO → npm run dev
│
├─ HEALTH CHECK RESPONDE?
│  ├─ SIM → Próximo
│  └─ NÃO → Verifique porta (lsof -i :8080)
│
├─ WEBHOOK GET RETORNA challenge?
│  ├─ SIM → Próximo
│  └─ NÃO → VERIFY_TOKEN está errado
│
├─ WEBHOOK POST RETORNA EVENT_RECEIVED?
│  ├─ SIM → Próximo
│  └─ NÃO → Verifique JSON do payload
│
├─ SERVIDOR PROCESSA MENSAGEM (vê nos logs)?
│  ├─ SIM → Próximo
│  └─ NÃO → Erro em processamento, veja logs detalhados
│
├─ SERVIDOR ENVIA POST PARA META/MP (vê nos logs)?
│  ├─ SIM → ✅ SUCESSO - Verifique WhatsApp/Mercado Pago
│  └─ NÃO → ❌ Token expirado ou inválido
│
└─ MENSAGEM CHEGOU NO WHATSAPP/PAGAMENTO CONFIRMADO?
   ├─ SIM → ✅ FLUXO COMPLETO
   └─ NÃO → Verifique tokens Meta/MP
```

---

## 🆘 SOLUÇÃO RÁPIDA (COPY-PASTE)

### Se tudo está offline:

```bash
# 1. Limpar cache de node
rm -rf node_modules
npm install

# 2. Atualizar variáveis de ambiente
# (Abra .env e verifique cada linha)

# 3. Reiniciar com logs detalhados
npm run dev 2>&1 | tee logs.txt

# 4. Em outro terminal, rodar testes
chmod +x test_api_local.sh
./test_api_local.sh

# 5. Ver erros específicos
tail -50 logs.txt | grep -i error
```

### Se tokens estão expirados:

```bash
# 1. Abrir Meta Dashboard
# https://developers.facebook.com → Seu App → WhatsApp → Configuration

# 2. Copiar novo WA_TOKEN

# 3. Atualizar .env
nano .env
# Trocar: WA_TOKEN=EAA...

# 4. Salvar e reiniciar
npm run dev
```

---

## ✅ CONFIRMAÇÕES DE SUCESSO

### ✅ Health Check Funcionando
```json
{"status":"ok"}
```

### ✅ Webhook Validado
```
challenge_retornado_por_meta
```

### ✅ POST Recebido
```
EVENT_RECEIVED
```

### ✅ Processamento OK (nos logs)
```
[DATE] POST /webhook/whatsapp
📨 Mensagem recebida: "oi"
✅ Resposta gerada
📤 POST enviado para WhatsApp API
200 OK
```

### ✅ Mensagem Chegou no WhatsApp
```
Sua mensagem apareceu na conversa
```

---

## 🚨 ERROS COMUNS E SOLUÇÕES

| Erro | Causa | Solução |
|------|-------|---------|
| `curl: (7) Failed to connect` | Servidor offline | `npm run dev` |
| `HTTP 403 Proibido` | VERIFY_TOKEN errado | Verifique `.env` |
| `HTTP 500` | Erro em código | Veja logs, `tail -50 logs.txt` |
| `socket hang up` | Firewall/Rede bloqueada | Verifique firewall |
| `[ECONNREFUSED]` | Ninguém ouvindo porta | Mude `PORT` ou mate outro processo |
| `timeout` | Servidor demorando demais | Adicione console.log para debug |
| `Token inválido` | Token expirado | Atualize em Meta/Mercado Pago |
| `No message to post` | Payload malformado | Verifique JSON do POST |

