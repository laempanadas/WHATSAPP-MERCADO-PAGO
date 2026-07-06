# ⚡ RESUMO EXECUTIVO: TESTE RÁPIDO

## 🎯 PROBLEMA: POST não chega, fluxo parou, sem erro visível

## ⚡ SOLUÇÃO RÁPIDA (5 MINUTOS)

### 1️⃣ Verificar variáveis de ambiente
```bash
cat .env | grep -E "^(BASE_URL|VERIFY_TOKEN|WA_TOKEN|MP_)"
```
❌ Se alguma está vazia → Preencha no `.env`

### 2️⃣ Iniciar servidor
```bash
npm run dev
```
❌ Se não responde → Verifique porta: `lsof -i :8080`

### 3️⃣ Rodar testes
```bash
chmod +x test_api_local.sh
./test_api_local.sh
```
✅ Se tudo ✅ → Fluxo está OK localmente
❌ Se algo ❌ → Veja qual teste falhou abaixo

### 4️⃣ Verificar logs
```bash
npm run dev 2>&1 | tee logs.txt
# Em outro terminal:
tail -50 logs.txt | grep -i erro
```

---

## 🔴 SE TESTE FALHOU: DIAGNOSTICAR

### ❌ Health Check falhou
```
Problema: Servidor offline
Solução: npm run dev
```

### ❌ Webhook GET retornou erro 403
```
Problema: VERIFY_TOKEN errado
Solução: Verifique .env VERIFY_TOKEN
         Copie o valor correto de Meta Dashboard
```

### ❌ Webhook POST retornou erro 500
```
Problema: Erro em processamento
Solução: Veja logs: tail -100 logs.txt
         Procure por "Erro" ou "Error"
```

### ❌ Servidor trava (não responde POST)
```
Problema: Código travado ou infinito
Solução: Ctrl+C (parar npm run dev)
         Adicione console.log() para debug
         Veja qual linha trava
```

---

## 🔗 SE PRECISA TESTAR NA CLOUD

### 1️⃣ Atualizar BASE_URL
```bash
# .env
BASE_URL=https://seu-dominio.com
# (Não esqueça HTTPS!)
```

### 2️⃣ Fazer deploy
```bash
git push  # ou seu método de deploy
```

### 3️⃣ Verificar se está vivo
```bash
curl https://seu-dominio.com/health
```

### 4️⃣ Registrar webhook em Meta
- Dashboard Meta → Webhooks
- URL: `https://seu-dominio.com/webhook/whatsapp`
- Verify Token: `SEU_VERIFY_TOKEN`
- Clique em "Verify"

---

## 📋 TESTES MANUAIS COM CURL

### Copie e cole no terminal:

#### Test 1: Health
```bash
curl http://localhost:8080/health
```

#### Test 2: Validação Webhook
```bash
curl "http://localhost:8080/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=seu_token&hub.challenge=test123"
```

#### Test 3: Mensagem de Texto
```bash
curl -X POST http://localhost:8080/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messaging_product":"whatsapp","messages":[{"from":"5511997088839","text":{"body":"oi"},"type":"text"}],"contacts":[{"wa_id":"5511997088839","profile":{"name":"Teste"}}]}}]}]}'
```

#### Test 4: Pagamento
```bash
curl -X POST http://localhost:8080/webhook/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"id":123,"type":"payment","data":{"id":"456"},"action":"payment.approved"}'
```

---

## 🆘 CAUSAS MAIS COMUNS

| Problema | Causa #1 | Causa #2 | Causa #3 |
|----------|----------|----------|----------|
| Servidor offline | `npm run dev` não rodou | Porta 8080 bloqueada | Erro em `server.js` |
| POST não processa | Token expirado | `.env` vazio | Firewall bloqueando |
| Sem erro mas nada funciona | BASE_URL errada | VERIFY_TOKEN errado | Webhook não registrado em Meta |
| Fluxo trava | Erro silencioso no código | Loop infinito | Timeout em API externa |

---

## 📁 ARQUIVOS CRIADOS

- **`GUIA_TESTES_LOCAL.md`** ← Guia completo (ler tudo)
- **`CHECKLIST_DIAGNOSTICO.md`** ← Checklist passo a passo
- **`REQUISICOES_PRONTAS.md`** ← Requisições prontas para copiar
- **`test_requests.http`** ← Requisições para VS Code HTTP Client
- **`test_api_local.sh`** ← Script de testes automáticos
- **`RESUMO_EXECUTIVO.md`** ← Este arquivo (leia primeiro!)

---

## ✅ PRÓXIMAS AÇÕES

1. [ ] Rode `./test_api_local.sh`
2. [ ] Se passou: Servidor OK ✅
3. [ ] Se falhou: Use `CHECKLIST_DIAGNOSTICO.md`
4. [ ] Se precisa em cloud: Atualize `BASE_URL` e webhook em Meta
5. [ ] Teste manual com `test_requests.http`

---

## 🎯 FLUXO ESPERADO

```
POST enviado por Meta/Cliente
         ↓
Servidor recebe (200 OK imediato)
         ↓
Servidor processa em background
         ↓
Servidor envia POST para Meta/MP API
         ↓
Mensagem entregue / Pagamento processado ✅
```

---

## 📞 ERROS COM AÇÃO IMEDIATA

| Erro | Ação Imediata |
|------|--------------|
| `ECONNREFUSED` | `npm run dev` |
| `HTTP 403` | Verifique tokens em `.env` |
| `HTTP 500` | Veja logs: `tail logs.txt` |
| `timeout` | Aumentar timeout ou otimizar código |
| `EADDRINUSE` | `lsof -i :8080` → `kill -9 PID` |
| `undefined token` | Preencher `.env` |

---

## 🚀 SE TUDO ESTÁ FUNCIONANDO

1. Teste com alguém real enviando mensagem no WhatsApp
2. Confirme que bot responde
3. Teste pedido real
4. Teste pagamento real
5. Confirme confirmação é entregue

**Se tudo funciona → 🎉 Sistema está pronto!**
