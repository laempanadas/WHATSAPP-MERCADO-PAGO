# 🛠️ CONFIGURAR HTTP CLIENT DO VS CODE

## O que é?

HTTP Client é uma extensão do VS Code que permite fazer requisições HTTP diretamente no editor, sem precisar de terminal ou Postman.

---

## 📦 INSTALAÇÃO

### 1️⃣ Instalar a extensão
- Abra VS Code
- Vá para Extensions (`Ctrl+Shift+X` ou `Cmd+Shift+X`)
- Procure: **"REST Client"**
- Clique em "Install" (Autor: Huachao Mao)

### 2️⃣ Confirmar que está instalada
- Abra qualquer arquivo `.http` ou `.rest`
- Você verá um botão **"Send Request"** acima das requisições

---

## 🚀 USAR HTTP CLIENT

### Opção 1: Usar arquivo já criado
```bash
# Arquivo já existe em:
/workspaces/WHATSAPP-MERCADO-PAGO/test_requests.http
```

1. Abra o arquivo: `test_requests.http`
2. Clique em qualquer linha: `Send Request`
3. Ver resposta no painel "REST Client"

### Opção 2: Criar novo arquivo `.http`

Crie novo arquivo `api-test.http`:

```http
@baseUrl = http://localhost:8080

###
# Test 1
GET {{baseUrl}}/health

###
# Test 2
POST {{baseUrl}}/webhook/whatsapp
Content-Type: application/json

{
  "test": "data"
}
```

Pressione **"Send Request"** acima de cada requisição.

---

## 💡 COMO USAR O ARQUIVO EXISTENTE

### 1️⃣ Abrir arquivo
```
test_requests.http
```

### 2️⃣ Navegar entre requisições

Cada `###` separa uma requisição.

```http
###
# ESTA É UMA REQUISIÇÃO
GET ...

###
# ESTA É OUTRA REQUISIÇÃO
POST ...
```

### 3️⃣ Enviar requisição

Clique em **"Send Request"** (aparece em cinza acima da requisição):

```http
###
  ↑ Clique aqui em "Send Request"
GET {{baseUrl}}/health
```

### 4️⃣ Ver resposta

Um painel novo abrirá mostrando:
- Status HTTP
- Response headers
- Response body
- Tempo de resposta

---

## 🎯 WORKFLOW RECOMENDADO

### Terminal 1: Servidor rodando
```bash
npm run dev 2>&1 | tee logs.txt
```

### VS Code: Editor esquerda
Abra `test_requests.http`

### VS Code: Painel direito
Clique em "Send Request" e veja a resposta

### Terminal 2: Monitorar logs
```bash
tail -f logs.txt
```

---

## 📊 ORDEM DE TESTES (Use o arquivo test_requests.http)

1. **Health Check** ← Primeiro, confirma servidor vivo
2. **Webhook GET (Validação)** ← Testa validação
3. **Webhook POST - Mensagem "oi"** ← Testa recebimento
4. **Webhook POST - Mensagem "cardápio"** ← Testa bot
5. **Webhook POST - Mensagem "2 carne"** ← Testa pedido
6. **Webhook POST - Confirmação "sim"** ← Testa confirmação
7. **Webhook POST - Pedido Catálogo** ← Testa compra
8. **Webhook Mercado Pago - Aprovado** ← Testa pagamento

---

## 🔍 INTERPRETAR RESPOSTAS

### ✅ Sucesso: HTTP 200
```
HTTP/1.1 200 OK
Content-Type: application/json

EVENT_RECEIVED
```

### ❌ Erro: HTTP 403
```
HTTP/1.1 403 Forbidden
Content-Type: application/json

{"message": "Invalid token"}
```
👉 VERIFY_TOKEN está errado

### ❌ Erro: HTTP 500
```
HTTP/1.1 500 Internal Server Error

Erro não tratado: TypeError: Cannot read...
```
👉 Veja logs no terminal

### ❌ Erro: Não consegue conectar
```
RequestError: connect ECONNREFUSED 127.0.0.1:8080
```
👉 Servidor offline, rode: `npm run dev`

---

## 💾 SALVAR E REUSAR REQUISIÇÕES

### Criar um arquivo pessoal
```http
# Arquivo: meu_teste.http

@baseUrl = http://localhost:8080
@telefone = 5511987654321
@produto = carne

###
# Teste com meu número
POST {{baseUrl}}/webhook/whatsapp
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "from": "{{telefone}}",
          "text": {"body": "{{produto}}"},
          "type": "text"
        }],
        "contacts": [{
          "wa_id": "{{telefone}}",
          "profile": {"name": "Meu Teste"}
        }]
      }
    }]
  }]
}
```

Depois mude `@telefone` e `@produto` conforme necessário.

---

## 📱 TESTAR COM NÚMEROS DIFERENTES

Crie um arquivo `teste_multiplos.http`:

```http
@baseUrl = http://localhost:8080

###
@phone = 5511111111111
# Cliente 1
POST {{baseUrl}}/webhook/whatsapp
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{"from": "{{phone}}", "text": {"body": "oi"}, "type": "text"}],
        "contacts": [{"wa_id": "{{phone}}", "profile": {"name": "Cliente1"}}]
      }
    }]
  }]
}

###
@phone = 5522222222222
# Cliente 2
POST {{baseUrl}}/webhook/whatsapp
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{"from": "{{phone}}", "text": {"body": "oi"}, "type": "text"}],
        "contacts": [{"wa_id": "{{phone}}", "profile": {"name": "Cliente2"}}]
      }
    }]
  }]
}
```

---

## 🔐 VARIÁVEIS DE AMBIENTE NO HTTP CLIENT

### Usar tokens do .env

Crie arquivo `rest-client.env.json` na raiz do projeto:

```json
{
  "dev": {
    "baseUrl": "http://localhost:8080",
    "verifyToken": "seu_token_aqui",
    "waToken": "EAA...",
    "mpToken": "APP_USR..."
  },
  "prod": {
    "baseUrl": "https://seu-dominio.com",
    "verifyToken": "seu_token_aqui",
    "waToken": "EAA...",
    "mpToken": "APP_USR..."
  }
}
```

Depois use em `.http`:

```http
@baseUrl = {{$dotenv baseUrl}}
@token = {{$dotenv verifyToken}}

###
GET {{baseUrl}}/webhook/whatsapp?hub.mode=subscribe&hub.verify_token={{token}}&hub.challenge=test
```

---

## 📝 DICAS E TRUQUES

### 1️⃣ Comentários
```http
# Este é um comentário
// Este também é um comentário
```

### 2️⃣ Separar requisições
```http
###
# Requisição 1

###
# Requisição 2
```

### 3️⃣ Usar dados da resposta anterior
```http
@baseUrl = http://localhost:8080

###
# Request 1: Obter algo
GET {{baseUrl}}/health

###
# Request 2: Usar resultado anterior
# (Automático com @name)
@statusCode = {{health.response.status}}
GET {{baseUrl}}/webhook/whatsapp?status={{statusCode}}
```

### 4️⃣ Adicionar header personalizado
```http
POST {{baseUrl}}/webhook/whatsapp
Content-Type: application/json
X-Custom-Header: valor
Authorization: Bearer {{token}}

{...}
```

### 5️⃣ Enviar arquivo como body
```http
POST {{baseUrl}}/upload
Content-Type: application/json

< ./data/payload.json
```

---

## 🎨 CONFIGURAÇÕES DO REST CLIENT

Arquivo `.vscode/settings.json`:

```json
{
  "rest-client.timeoutinmilliseconds": 30000,
  "rest-client.showResponseInDifferentTab": true,
  "rest-client.previewColumn": "right",
  "rest-client.defaultHeaders": {
    "User-Agent": "REST Client"
  }
}
```

---

## 🚀 FLOW COMPLETO COM HTTP CLIENT

### 1️⃣ Terminal: Servidor
```bash
npm run dev
```

### 2️⃣ VS Code: Abrir test_requests.http
```
Ctrl/Cmd + O → test_requests.http
```

### 3️⃣ Clicar em "Send Request"
```
Clique acima de cada requisição
```

### 4️⃣ Ver resposta
```
Panel direita mostra resultado
```

### 5️⃣ Ver logs
```
Terminal mostra processamento
```

### 6️⃣ Próxima requisição
```
Clique em outra requisição
```

---

## 📚 REFERÊNCIA RÁPIDA

| Comando | O que faz |
|---------|----------|
| `###` | Separa requisições |
| `@variavel = valor` | Define variável |
| `{{variavel}}` | Usa variável |
| `{{$timestamp}}` | Timestamp automático |
| `{{$uuid}}` | UUID aleatório |
| `{{$randomInt min max}}` | Número aleatório |
| `Send Request` | Executa requisição |
| `Click Link` | Abre link na resposta |

---

## ✅ CHECKLIST

- [ ] Extensão "REST Client" instalada
- [ ] Arquivo `test_requests.http` aberto
- [ ] Servidor rodando (`npm run dev`)
- [ ] Clicou em "Send Request" em Health Check
- [ ] Viu resposta no painel direito
- [ ] Testou todas as 8 requisições
- [ ] Servidor está processando corretamente
- [ ] Logs mostram sucesso

✅ **Se tudo OK → Sistema pronto!**
