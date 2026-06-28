# 🔔 Lembretes Automáticos (Recuperação de Vendas)

Este guia explica os lembretes automáticos que o bot envia para recuperar
vendas quando o cliente **não paga** ou **abandona o pedido no meio**, e qual é
a **melhor estratégia** para deixá-los funcionando de forma confiável.

---

## 🤔 O problema que isso resolve

Muita venda se perde por dois motivos simples:

1. **Pagamento pendente** — o cliente recebe o botão de pagamento, mas se
   distrai e não conclui o pagamento.
2. **Carrinho abandonado** — o cliente monta o pedido (ou está escolhendo os
   sabores do combo / digitando o endereço) e some antes de confirmar.

O bot agora resolve os dois automaticamente, sem você precisar fazer nada. 🙌

---

## 📨 O que o bot envia, e quando

### 1) Lembrete de pagamento pendente
- **Quando:** cerca de **15 minutos** depois de gerar o link e o cliente ainda
  não ter pago.
- **O que envia:** uma mensagem gentil + o **botão "Pagar agora"** de novo.
- Envia **apenas uma vez** por pedido.
- Se o cliente pagar, o lembrete é cancelado automaticamente (o sistema é
  avisado pelo Mercado Pago).
- Depois de **2 horas** sem pagar, o pedido é descartado (o link expira).

### 2) Lembrete de carrinho abandonado
- **Quando:** cerca de **10 minutos** de inatividade, quando o cliente parou no
  meio (escolhendo sabores, confirmando o pedido ou digitando o endereço).
- **O que envia:** um empurãozinho do tipo "ainda está aí? seu pedido está
  quase pronto 😋".
- Envia **apenas uma vez**, para não incomodar.

> Os tempos podem ser ajustados por variáveis de ambiente (veja abaixo).

---

## ⚙️ Tempos configuráveis (opcional)

No Cloud Run, em **Variáveis e secrets**, você pode ajustar (valores em
**minutos**):

| Variável | Padrão | O que faz |
|---|---|---|
| `LEMBRETE_PAGAMENTO_MIN` | `15` | Espera antes de lembrar do pagamento |
| `EXPIRA_PAGAMENTO_MIN` | `120` | Tempo para desistir do pagamento pendente |
| `LEMBRETE_CARRINHO_MIN` | `10` | Inatividade antes de cutucar o carrinho |
| `EXPIRA_CARRINHO_MIN` | `30` | Limite para o lembrete de carrinho |

Se não configurar nada, os padrões acima já funcionam bem.

---

## ⭐ MELHOR ESTRATÉGIA (importante!)

Os lembretes funcionam por um "relógio" interno que roda dentro do servidor
(Cloud Run). Para esse relógio nunca parar, o servidor precisa ficar **sempre
ligado**.

Por padrão, o Cloud Run **desliga o servidor quando ninguém está usando** (para
economizar). Se ele desligar, os lembretes pendentes naquele momento não são
enviados.

### ✅ Recomendação: deixar 1 instância sempre ligada (min-instances = 1)

Isso mantém o servidor "acordado" o tempo todo. O custo é baixo e garante que
os lembretes saiam sempre.

**Passo a passo (no navegador):**
1. Acesse o **Google Cloud Console** → **Cloud Run**.
2. Clique no serviço **`whatsappmercadopago`**.
3. Clique em **"Editar e implantar nova revisão"** (Edit & deploy new revision).
4. Abra a aba **"Container(s)"** → seção **"Capacidade"** (Capacity).
5. Em **"Número mínimo de instâncias"** (Minimum number of instances), coloque
   **`1`**.
6. Clique em **"Implantar"** (Deploy) e aguarde alguns minutos.

Pronto! A partir daí os lembretes vão disparar de forma confiável. 🎉

### 🔮 Para o futuro (quando a loja crescer muito)
Quando o volume de pedidos ficar grande, o ideal é guardar os pedidos
pendentes em um banco de dados (Firestore/Redis) e disparar a verificação por
um agendador externo (Cloud Scheduler). Aí dá para usar vários servidores ao
mesmo tempo sem perder nenhum lembrete. Por enquanto, **min-instances = 1** já
atende muito bem. 👍

---

## 📄 Resumo rápido

- ✅ Lembrete de pagamento em ~15 min (1 vez, com botão de pagar).
- ✅ Lembrete de carrinho abandonado em ~10 min (1 vez).
- ✅ Cancelamento automático quando o cliente paga.
- ⭐ Configure **min-instances = 1** no Cloud Run para tudo funcionar redondo.
