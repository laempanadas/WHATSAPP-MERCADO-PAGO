# 📚 ÍNDICE DE DOCUMENTOS - GUIA COMPLETO DE TESTES

## 🎯 POR ONDE COMEÇAR?

### ⚡ **Se está com pressa (5 minutos)**
👉 Leia: **[RESUMO_EXECUTIVO.md](RESUMO_EXECUTIVO.md)**
- Passos rápidos para testar
- Causas comuns e soluções
- Diagnóstico rápido

---

### 📖 **Se quer entender tudo (30 minutos)**
👉 Leia: **[GUIA_TESTES_LOCAL.md](GUIA_TESTES_LOCAL.md)**
- Explicação completa do problema
- Fluxo de diagnóstico detalhado
- Testes manuais e automatizados
- Debugging avançado

---

### ✅ **Se quer fazer passo a passo**
👉 Leia: **[CHECKLIST_DIAGNOSTICO.md](CHECKLIST_DIAGNOSTICO.md)**
- 8 passos ordenados
- O que fazer em cada passo
- O que procurar nos logs
- Soluções para cada problema

---

### 💻 **Se quer copiar-colar requisições**
👉 Leia: **[REQUISICOES_PRONTAS.md](REQUISICOES_PRONTAS.md)**
- Requisições curl prontas
- Variações de testes
- Fluxo completo pré-configurado
- Copie e cole no terminal

---

### 🛠️ **Se prefere GUI (VS Code HTTP Client)**
👉 Use: **[test_requests.http](test_requests.http)** + Leia: **[HTTP_CLIENT_VS_CODE.md](HTTP_CLIENT_VS_CODE.md)**
- Arquivo pronto para usar
- Clique e veja respostas
- Visual, sem linhas de comando
- Instale extensão "REST Client"

---

### 🧪 **Se quer rodar script automático**
```bash
chmod +x test_api_local.sh
./test_api_local.sh
```
- Testa tudo de uma vez
- Mostra quem passou/falhou
- Indica próximos passos

---

## 📋 LISTA DE DOCUMENTOS

| Documento | Tamanho | Tempo | Para quem? |
|-----------|---------|-------|-----------|
| [RESUMO_EXECUTIVO.md](RESUMO_EXECUTIVO.md) | 📄 Curto | 5 min | Quem tem pressa |
| [GUIA_TESTES_LOCAL.md](GUIA_TESTES_LOCAL.md) | 📖 Longo | 30 min | Quem quer entender |
| [CHECKLIST_DIAGNOSTICO.md](CHECKLIST_DIAGNOSTICO.md) | ✅ Passo a passo | 15 min | Quem prefere checklist |
| [REQUISICOES_PRONTAS.md](REQUISICOES_PRONTAS.md) | 📝 Referência | 10 min | Quem quer copiar-colar |
| [HTTP_CLIENT_VS_CODE.md](HTTP_CLIENT_VS_CODE.md) | 🛠️ Tutorial | 15 min | Quem prefere GUI |
| [test_requests.http](test_requests.http) | 📦 Arquivo | 2 min | Usar no VS Code |
| [test_api_local.sh](test_api_local.sh) | 🤖 Script | Auto | Testar tudo automático |

---

## 🎯 ROTAS DE APRENDIZADO

### ROTA 1: "Quero resolver rápido"
1. Leia **RESUMO_EXECUTIVO.md** (5 min)
2. Execute **test_api_local.sh** (2 min)
3. Se falhar: Use **CHECKLIST_DIAGNOSTICO.md**
4. Se sucesso: ✅ Pronto!

### ROTA 2: "Quero entender tudo"
1. Leia **GUIA_TESTES_LOCAL.md** (completo)
2. Pratique com **REQUISICOES_PRONTAS.md**
3. Use **HTTP_CLIENT_VS_CODE.md** para GUI
4. Implemente melhorias

### ROTA 3: "Prefiro GUI (sem terminal)"
1. Instale extensão "REST Client" no VS Code
2. Abra **test_requests.http**
3. Leia **HTTP_CLIENT_VS_CODE.md**
4. Clique em "Send Request" para cada teste

### ROTA 4: "Quer diagnosticar problema específico"
1. Execute **test_api_local.sh** (ver qual falhou)
2. Vá para **CHECKLIST_DIAGNOSTICO.md**
3. Procure pelo teste que falhou
4. Siga a solução indicada

---

## 🔍 ENCONTRAR RESPOSTA RÁPIDA

### "Servidor não está respondendo"
👉 **RESUMO_EXECUTIVO.md** → Seção "Servidor offline"
👉 **CHECKLIST_DIAGNOSTICO.md** → Passo 2

### "GET webhook validação falha"
👉 **GUIA_TESTES_LOCAL.md** → Seção 4
👉 **CHECKLIST_DIAGNOSTICO.md** → Passo 7 → "VERIFY_TOKEN"

### "POST não chega ao servidor"
👉 **GUIA_TESTES_LOCAL.md** → Seção 9 → Checklist
👉 **REQUISICOES_PRONTAS.md** → Teste com curl

### "Como enviar requisição manual?"
👉 **REQUISICOES_PRONTAS.md** (curl)
👉 **test_requests.http** (HTTP Client)
👉 **HTTP_CLIENT_VS_CODE.md** (Tutorial)

### "Tokens estão expirados"
👉 **CHECKLIST_DIAGNOSTICO.md** → Passo 5

### "Ver logs em tempo real"
👉 **GUIA_TESTES_LOCAL.md** → Seção 11
👉 **CHECKLIST_DIAGNOSTICO.md** → Passo 4

---

## 📊 FLUXO DE DIAGNÓSTICO VISUAL

```
┌─ PROBLEMA: POST não chega
│
├─ Leia RESUMO_EXECUTIVO.md (2 min)
│
├─ Execute test_api_local.sh
│  ├─ PASSOU? → Parabéns! ✅
│  └─ FALHOU? → Proxímo passo
│
├─ Qual teste falhou?
│  ├─ Health Check → Servidor offline
│  ├─ Webhook GET → VERIFY_TOKEN errado
│  ├─ Webhook POST → Erro em processamento
│  └─ Mercado Pago → Token expirado
│
├─ Abra CHECKLIST_DIAGNOSTICO.md
│  └─ Procure o passo correspondente
│
└─ Siga a solução → Problema resolvido ✅
```

---

## 🚀 QUICKSTART (30 segundos)

```bash
# 1. Terminal 1: Servidor
npm run dev

# 2. Terminal 2: Testes
chmod +x test_api_local.sh
./test_api_local.sh

# 3. Ver resultado
# ✅ Todos passaram? → Problema resolvido!
# ❌ Alguém falhou? → Leia CHECKLIST_DIAGNOSTICO.md
```

---

## 📁 ARQUIVOS CRIADOS

```
/workspaces/WHATSAPP-MERCADO-PAGO/
├── RESUMO_EXECUTIVO.md ⭐ Leia primeiro
├── GUIA_TESTES_LOCAL.md (completo, 13 seções)
├── CHECKLIST_DIAGNOSTICO.md (8 passos)
├── REQUISICOES_PRONTAS.md (curl + variações)
├── HTTP_CLIENT_VS_CODE.md (tutorial GUI)
├── test_requests.http (arquivo para VS Code)
├── test_api_local.sh (script automático)
└── INDICE.md (este arquivo)
```

---

## 💡 DICAS

### 1️⃣ Se não sabe por onde começar
→ Comece por **RESUMO_EXECUTIVO.md**

### 2️⃣ Se sabe qual é o problema
→ Procure no **CHECKLIST_DIAGNOSTICO.md**

### 3️⃣ Se quer copiar requisições
→ Use **REQUISICOES_PRONTAS.md** ou **test_requests.http**

### 4️⃣ Se quer entender a fundo
→ Leia **GUIA_TESTES_LOCAL.md**

### 5️⃣ Se não quer usar terminal
→ Use **HTTP_CLIENT_VS_CODE.md** + **test_requests.http**

---

## ✅ CONFIRMAÇÕES DE SUCESSO

Se você conseguir fazer isso, o sistema está funcionando:

- [ ] Servidor responde em `localhost:8080/health`
- [ ] Webhook GET valida corretamente
- [ ] Webhook POST recebe e processa mensagens
- [ ] Bot responde com cardápio
- [ ] Cliente consegue fazer pedido
- [ ] Link de pagamento é gerado
- [ ] Mercado Pago confirma pagamento
- [ ] Cliente recebe confirmação no WhatsApp

✅ **Todos? Parabéns, sistema pronto para produção!**

---

## 🔗 PRÓXIMOS PASSOS

1. **Local funcionando?** → Vá para cloud/produção
2. **Em produção?** → Teste com cliente real
3. **Tudo ok?** → Implante melhorias (rate limiting, logs, etc)
4. **Encontrou bug?** → Use logs para entender e corrigir

---

## 📞 RESUMO FINAL

| Necessidade | Arquivo |
|-------------|---------|
| Ler rápido | RESUMO_EXECUTIVO.md |
| Entender tudo | GUIA_TESTES_LOCAL.md |
| Passo a passo | CHECKLIST_DIAGNOSTICO.md |
| Copiar requisição | REQUISICOES_PRONTAS.md |
| GUI visual | test_requests.http |
| Tutorial GUI | HTTP_CLIENT_VS_CODE.md |
| Teste automático | test_api_local.sh |

---

**Boa sorte! 🚀**
