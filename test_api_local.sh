#!/bin/bash

# 🧪 SCRIPT PARA TESTAR API LOCAL - DIAGNOSTICAR POSTS QUE NÃO CHEGAM

set -e

RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

echo -e "${BLUE}========================================${RESET}"
echo -e "${BLUE}🧪 TESTE COMPLETO DA API LOCAL${RESET}"
echo -e "${BLUE}========================================${RESET}\n"

# Configurar
SERVER="http://localhost:8080"
VERIFY_TOKEN="${VERIFY_TOKEN:-seu_token_aqui}"

# Teste 1: Health Check
echo -e "${YELLOW}[1/5] Testando Health Check...${RESET}"
if response=$(curl -s -w "\n%{http_code}" "$SERVER/health"); then
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Servidor respondendo em $SERVER${RESET}"
        echo -e "   Resposta: $body\n"
    else
        echo -e "${RED}❌ Servidor retornou HTTP $http_code${RESET}"
        echo -e "   Resposta: $body\n"
        exit 1
    fi
else
    echo -e "${RED}❌ Não consegue conectar em $SERVER${RESET}"
    echo -e "   Execute: npm run dev\n"
    exit 1
fi

# Teste 2: Validação Webhook (GET)
echo -e "${YELLOW}[2/5] Testando validação Webhook (GET)...${RESET}"
challenge="test_challenge_12345"
if response=$(curl -s -w "\n%{http_code}" "$SERVER/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=$VERIFY_TOKEN&hub.challenge=$challenge"); then
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ] && [ "$body" = "$challenge" ]; then
        echo -e "${GREEN}✅ Webhook GET validado corretamente${RESET}\n"
    else
        echo -e "${RED}❌ Webhook GET retornou HTTP $http_code${RESET}"
        echo -e "   Resposta: $body"
        echo -e "   Verifique VERIFY_TOKEN no .env\n"
    fi
else
    echo -e "${RED}❌ Erro na requisição GET${RESET}\n"
fi

# Teste 3: Webhook POST (Mensagem de texto)
echo -e "${YELLOW}[3/5] Testando Webhook POST (mensagem de texto)...${RESET}"
payload='{
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
                  "name": "Teste Usuario"
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

if response=$(curl -s -w "\n%{http_code}" -X POST "$SERVER/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -d "$payload"); then
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ] && [[ "$body" == *"EVENT_RECEIVED"* ]]; then
        echo -e "${GREEN}✅ Webhook POST recebido corretamente${RESET}"
        echo -e "   Resposta: $body"
        echo -e "   ➡️  Verifique console do servidor para processamento\n"
    else
        echo -e "${RED}❌ Webhook POST retornou HTTP $http_code${RESET}"
        echo -e "   Resposta: $body\n"
    fi
else
    echo -e "${RED}❌ Erro na requisição POST${RESET}\n"
fi

# Teste 4: Webhook POST (Pedido do catálogo)
echo -e "${YELLOW}[4/5] Testando Webhook POST (pedido do catálogo)...${RESET}"
order_payload='{
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
                "text": "Pedido de catálogo",
                "from": "5511997088839",
                "id": "order_123",
                "timestamp": "1699564000"
              }
            ],
            "contacts": [
              {
                "profile": {
                  "name": "Maria Teste"
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

if response=$(curl -s -w "\n%{http_code}" -X POST "$SERVER/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -d "$order_payload"); then
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ] && [[ "$body" == *"EVENT_RECEIVED"* ]]; then
        echo -e "${GREEN}✅ Webhook de pedido recebido corretamente${RESET}"
        echo -e "   Resposta: $body"
        echo -e "   ➡️  Verifique console para link de pagamento\n"
    else
        echo -e "${RED}❌ Webhook de pedido retornou HTTP $http_code${RESET}"
        echo -e "   Resposta: $body\n"
    fi
else
    echo -e "${RED}❌ Erro na requisição de pedido${RESET}\n"
fi

# Teste 5: Webhook Mercado Pago
echo -e "${YELLOW}[5/5] Testando Webhook Mercado Pago...${RESET}"
mp_payload='{
  "id": 123456789,
  "type": "payment",
  "data": {
    "id": "987654321"
  },
  "action": "payment.approved"
}'

if response=$(curl -s -w "\n%{http_code}" -X POST "$SERVER/webhook/mercadopago" \
  -H "Content-Type: application/json" \
  -d "$mp_payload"); then
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ] && [[ "$body" == *"EVENT_RECEIVED"* ]]; then
        echo -e "${GREEN}✅ Webhook Mercado Pago recebido corretamente${RESET}"
        echo -e "   Resposta: $body\n"
    else
        echo -e "${RED}❌ Webhook MP retornou HTTP $http_code${RESET}"
        echo -e "   Resposta: $body\n"
    fi
else
    echo -e "${RED}❌ Erro na requisição Mercado Pago${RESET}\n"
fi

# Resumo
echo -e "${BLUE}========================================${RESET}"
echo -e "${GREEN}✅ TESTES CONCLUÍDOS${RESET}"
echo -e "${BLUE}========================================${RESET}\n"

echo -e "${YELLOW}📝 PRÓXIMOS PASSOS:${RESET}"
echo "1. Verifique os logs do console do servidor"
echo "2. Procure por mensagens de ERRO"
echo "3. Confirme que BASE_URL está correto no .env"
echo "4. Verifique tokens (WA_TOKEN, MP_ACCESS_TOKEN)"
echo -e "\n${YELLOW}🔧 PARA DEBUG AVANÇADO:${RESET}"
echo "- Ver logs: tail -f logs.txt"
echo "- Monitorar requisições: sudo tcpdump -i lo -A 'tcp port 8080'"
echo ""
