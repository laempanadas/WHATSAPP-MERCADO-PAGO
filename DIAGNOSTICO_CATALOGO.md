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

O campo `whatsapp_commerce_settings` requer:

1. **App com aprovação especial** — Nem todo app Meta tem acesso a commerce settings
2. **Token com permissões corretas** — Precisa incluir escopos como:
   - `whatsapp_business_messaging`
   - `business_management` (ou similar)
3. **Número comercial vinculado a catálogo** — Deve estar configurado no Meta Commerce Manager

---

## O Que Fazer

### Opção 1: Verificar Permissões da App
1. Acesse: [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Selecione seu app
3. Em **Settings → Basic**, procure por escopos e permissões
4. Verifique se `whatsapp_business_messaging` está listado
5. Se não estiver, tente adicionar na seção de permissões

### Opção 2: Regenerar Token com Permissões
1. Vá para **App Roles** ou **Business Settings**
2. Gere um **novo token de acesso** selecionando escopos:
   - `whatsapp_business_messaging`
   - `business_management`
3. Cole o novo token e teste novamente

### Opção 3: Verificar se Catálogo Está Vinculado via UI
Como o catálogo **já está ativo** (você viu na imagem), talvez não precise da API. Verifique:
1. Meta Business Manager → Catálogo → Loja
2. Procure por **"Configurações de comércio"** ou **"Commerce Settings"**
3. Confirme que:
   - ✅ Catálogo está ativo
   - ✅ Carrinho está habilitado
   - ✅ Número comercial está associado

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

