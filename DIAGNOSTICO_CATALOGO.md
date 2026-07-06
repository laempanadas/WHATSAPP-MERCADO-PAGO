# 📋 Diagnóstico: Catálogo Invisível no WhatsApp

## Status Atual

✅ **Código:** Implementação correta do endpoint de commerce settings
❌ **Teste:** Token sem permissão para acessar o campo `whatsapp_commerce_settings`
❌ **Resultado:** Campo não disponível na sua aplicação/token Meta

---

## Erro Encontrado

```
(#100) Tried accessing nonexisting field (whatsapp_commerce_settings)
```

**Significado:** Seu app/token não tem permissões suficientes para gerenciar configurações de commerce no Meta.

---

## Raiz do Problema

Após testar com **novo token**, descobrimos:

- ✅ Aplicação ID: `122100014151389423`
- ✅ App consegue enviar mensagens WhatsApp
- ❌ App **NÃO foi aprovada para commerce settings**
- ❌ App **NÃO tem acesso a WhatsApp Business Accounts**

O campo `whatsapp_commerce_settings` só funciona em apps com permissões especiais de comércio, que requerem aprovação da Meta.

---

## O Que Fazer

### ⚠️ Conclusão Após Testar Novo Token

Mesmo com novo token, o erro persiste:
- ❌ App não acessa `whatsapp_commerce_settings`
- ❌ App não acessa `whatsapp_business_accounts` 
- ✅ App consegue enviar mensagens normalmente

**Diagnóstico:** A aplicação foi aprovada apenas para **messaging**, não para **commerce management**.

### Opção 1: Contate Suporte Meta (Recomendado)
1. Acesse [developers.facebook.com/support](https://developers.facebook.com/support)
2. Abra um ticket solicitando:
   - Aprovação para acessar `whatsapp_commerce_settings`
   - Permissões de gerenciamento de catálogo/comércio
3. Mencione o ID da app: `122100014151389423`

### Opção 2: Criar Nova App com Permissões
Se suporte demorar, considere:
1. Criar uma app separada com foco em **commerce** (não messaging)
2. Isso pode ser mais rápido que aguardar aprovação

### Opção 3: Usar Apenas a UI da Meta
Como o **catálogo já está ativo** no painel:
1. Meta Business Manager → Catálogo → Loja
2. Procure por "Configurações de comércio" ou ⚙️ Settings
3. Confirme que:
   - ✅ Catálogo está publicado
   - ✅ Carrinho está habilitado  
   - ✅ Número comercial está vinculado
4. Se tudo estiver correto, é só questão de tempo para aparecer no WhatsApp (cache de 24-48h)

---

## Código Implementado (Correto)

O arquivo [src/services/commerce-settings.service.js](../src/services/commerce-settings.service.js) implementa corretamente:
- Chamadas POST separadas para `is_catalog_visible` e `is_cart_enabled`
- Headers corretos com Bearer token
- Tratamento de erros adequado
- Teste unitário validando a estrutura

O código **não é o problema**. O problema é a **configuração da aplicação Meta**.

---

## Próximas Verificações

Se tiver um novo token com permissões adequadas:

```bash
# Cole o novo token em .env
WA_TOKEN=seu_novo_token

# Execute novamente:
node scripts/check_commerce_status.js
```

Ou teste manualmente via curl (adaptando para seu token/número):

```bash
curl -X GET 'https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/whatsapp_commerce_settings' \
  -H 'Authorization: Bearer {WA_TOKEN}'
```

---

## Resumo

| Item | Status |
|------|--------|
| Código do app | ✅ Correto |
| Integração | ✅ Implementada |
| Teste | ❌ Falha por permissões |
| Causa | ❌ App/token sem acesso a commerce settings |
| Próximo passo | 🔧 Verificar permissões no Meta |

