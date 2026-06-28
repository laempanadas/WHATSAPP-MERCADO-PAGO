# 🚀 Como Ativar Pagamentos Reais (Sair do Modo de Teste)

Este guia explica como trocar as credenciais do **modo sandbox (teste)** para o **modo produção** e começar a receber pagamentos reais.

---

## 📋 Pré-requisitos

Antes de começar, você precisa:
- ✅ Ter uma conta verificada no Mercado Pago
- ✅ Ter ativado a opção de receber pagamentos (pode precisar enviar documentos)
- ✅ Ter acesso ao painel do Mercado Pago

---

## 🔑 Passo 1: Obter suas Credenciais de Produção

1. **Entre no painel do Mercado Pago:**
   - Acesse: https://www.mercadopago.com.br/developers/panel/app
   - Faça login com sua conta

2. **Vá em "Suas integrações" ou "Suas aplicações"**

3. **Crie uma nova aplicação** (se ainda não tem):
   - Clique em **"Criar aplicação"**
   - Nome: `La Empanadas WhatsApp`
   - Tipo: **Pagamentos online e marketplace**
   - Modelo de integração: **Checkout API** ou **Preferências de pagamento**

4. **Copie suas credenciais de PRODUÇÃO:**
   - No menu lateral, clique em **"Credenciais"**
   - **ATENÇÃO:** Escolha a aba **"Credenciais de produção"** (não use "Credenciais de teste")
   - Copie o **Access Token de produção**
   - Vai ser algo como: `APP_USR-1234567890123456-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-123456789`

⚠️ **IMPORTANTE:** Guarde esse token em um lugar seguro. Nunca compartilhe no WhatsApp, email ou qualquer lugar público.

---

## ☁️ Passo 2: Atualizar as Credenciais no Cloud Run

Agora você precisa trocar o token de teste pelo token de produção no Google Cloud Run:

### 📱 **OPÇÃO 1: Pelo Navegador (Mais Fácil)**

1. **Abra o Google Cloud Run:**
   - Acesse: https://console.cloud.google.com/run
   - Entre com a mesma conta Google que você usou para fazer o deploy

2. **Encontre seu serviço:**
   - Procure o serviço chamado **`whatsappmercadopago`** (ou o nome que você deu)
   - Clique nele para abrir

3. **Edite as variáveis de ambiente:**
   - Clique no botão **"EDITAR E IMPLANTAR NOVA REVISÃO"** (no topo da página)
   - Role a página até encontrar a seção **"Variáveis e secrets"**
   - Clique em **"VARIÁVEIS E SECRETS"** para expandir

4. **Troque o MP_ACCESS_TOKEN:**
   - Encontre a linha `MP_ACCESS_TOKEN`
   - Apague o valor antigo (que começa com `TEST-...`)
   - Cole o **Access Token de produção** que você copiou no Passo 1
   - **Certifique-se de que não tem espaços no começo ou no fim**

5. **Salve as mudanças:**
   - Role até o fim da página
   - Clique no botão azul **"IMPLANTAR"**
   - Aguarde uns 2-3 minutos (a página vai mostrar o progresso)
   - Quando aparecer ✅ verde, está pronto!

### 💻 **OPÇÃO 2: Por Linha de Comando (Avançado)**

Se você prefere usar o terminal:

```bash
# 1. Instale o gcloud CLI (se ainda não tem)
# https://cloud.google.com/sdk/docs/install

# 2. Faça login
gcloud auth login

# 3. Configure o projeto
gcloud config set project SEU_PROJETO_ID

# 4. Atualize a variável de ambiente
gcloud run services update whatsappmercadopago \
  --region=southamerica-east1 \
  --update-env-vars MP_ACCESS_TOKEN=SEU_TOKEN_DE_PRODUCAO_AQUI

# 5. Aguarde o deploy terminar
```

---

## ✅ Passo 3: Testar se Funcionou

1. **Mande "oi" no WhatsApp do bot:** +55 11 2669-0644

2. **Faça um pedido de teste:**
   - Digite: `1 carne`
   - Confirme: `sim`
   - Envie um endereço: `Rua de Teste 123, Centro`

3. **Clique no botão "Pagar agora"**

4. **ATENÇÃO:** Agora você vai ver a tela do Mercado Pago REAL (não sandbox):
   - ✅ Se aparecer **suas opções de pagamento normais** (cartão de crédito, Pix, etc.) = FUNCIONOU!
   - ❌ Se aparecer "sandbox.mercadopago.com.br" na URL = ainda está em teste, volte ao Passo 2

5. **NÃO pague de verdade** (a menos que queira comprar uma empanada de teste de você mesmo 😄)

---

## 🔒 Segurança: O que NÃO fazer

- ❌ **Nunca** compartilhe seu Access Token de produção por WhatsApp, email ou redes sociais
- ❌ **Nunca** coloque o token dentro do código (ele já está na variável de ambiente, está seguro)
- ❌ **Nunca** use o token de teste em produção (os clientes não conseguem pagar de verdade)

---

## 🆘 Problemas Comuns

### "Erro ao gerar pagamento" no WhatsApp
- Verifique se você copiou o token COMPLETO (sem espaços)
- Verifique se é o token de PRODUÇÃO (não o de teste)
- Espere 3-5 minutos após atualizar no Cloud Run

### "sandbox.mercadopago.com.br" ainda aparece na URL
- Significa que o Cloud Run ainda está usando o token antigo
- Volte ao Passo 2 e confira se a variável `MP_ACCESS_TOKEN` foi mesmo trocada
- Depois de salvar, aguarde o deploy terminar (semáforo verde)

### "Pagamento não aprovado"
- Se você está testando com seu próprio cartão, o Mercado Pago pode bloquear (detecta como teste)
- Peça para um amigo testar, ou use valores pequenos (R$ 1-2)

---

## 📞 Precisa de Ajuda?

Se algo não funcionou, me mande:
1. Uma foto da tela de erro (se aparecer)
2. A mensagem que o bot mandou no WhatsApp
3. Se a URL do pagamento tem "sandbox" ou não

Estou aqui pra te ajudar! 😊
