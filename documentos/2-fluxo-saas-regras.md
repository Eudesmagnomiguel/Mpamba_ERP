# Fluxo do SaaS, Regras de Negócio e Parametrização

Este documento detalha a arquitetura lógica do modelo SaaS, as regras de negócio de cada módulo operacional e a parametrização do sistema **Mpamba**.

---

## ☁️ 1. Arquitetura e Fluxo do SaaS

O sistema Mpamba opera sob uma arquitetura Multi-Tenant modular, onde organizações compartilham o mesmo banco de dados mas são logicamente isoladas.

```
                  ┌────────────────────────┐
                  │      SUBSCRIÇÃO        │
                  │ (Controla Nível/Acesso)│
                  └───────────┬────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │      ORGANIZAÇÃO       │
                  │   (Escopo de Dados)    │
                  └───────────┬────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
     ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
     │  FATURAÇÃO  │   │    STOCK    │   │  TESOURARIA │
     │  (Billing)  │   │  (Opcional) │   │  (Opcional) │
     └─────────────┘   └─────────────┘   └─────────────┘
```

### 🔓 Controle de Acesso e Subscrição
1. **Independência de Domínio**: A subscrição controla apenas a permissão comercial de uso, sem intervir na lógica financeira ou contábil interna do ERP.
2. **Nível de Planos**:
   * **Starter**: Apenas acesso ao módulo de **Faturação**.
   * **Business**: Acesso à **Faturação** e **Tesouraria**.
   * **Enterprise**: Acesso total (**Faturação**, **Stock** e **Tesouraria**).
3. **Mecanismo de Guardas (Middlewares)**:
   * **`moduleGuard`**: Antes de qualquer requisição às APIs de um módulo específico, o middleware valida se a organização do usuário ativo possui esse módulo contratado no seu plano. Se não, bloqueia com erro `403 MODULE_LOCKED`.
   * **`subscriptionGuard`**: Verifica se o status da subscrição está ativo (`ACTIVE` ou `TRIAL`). Se a subscrição estiver expirada ou suspensa, o guard **permite apenas requisições de leitura (GET)** e **bloqueia todas as ações de escrita (POST, PUT, DELETE, PATCH)** retornando `402 SUBSCRIPTION_REQUIRED`.

---

## 🧾 2. Regras de Negócio — Faturação

O módulo de faturação é responsável por gerar documentos legais imutáveis, baseando-se em regras fiscais estritas.

### Ciclo de Vida da Fatura
* **DRAFT (Rascunho)**: Estado inicial onde o documento pode ser modificado, itens podem ser adicionados/removidos e dados do cliente alterados.
* **ISSUED (Emitida)**: Uma vez emitida, a fatura torna-se **legalmente imutável**. Não pode ser apagada ou editada. O número sequencial oficial da fatura é gerado exclusivamente neste momento.
* **CANCELLED (Cancelada)**: Apenas faturas com status `ISSUED` podem ser canceladas. É necessário fornecer uma justificativa para o cancelamento. O documento mantém o número original no sistema para auditoria fiscal (nunca é apagado).

### Numeração Sequencial
* Segue o padrão `PREFIXO-ANO-SEQUÊNCIA` (ex: `FT-2026-000123`).
* Gerada de forma contígua e incremental por ano e por série de faturação.
* Para evitar duplicações causadas por concorrência simultânea, a emissão executa um bloqueio de banco de dados (*database lock*) na tabela `InvoiceSeries` para ler o próximo número da sequência, incrementá-lo e salvar a fatura na mesma transação atômica.

### Cálculo da Fatura (Backend como Fonte da Verdade)
* Cada item possui quantidade ($Q$), preço unitário ($P$), desconto ($D$) e taxa de imposto ($I$).
* O backend realiza o cálculo de forma estrita:
  $$\text{Subtotal do Item} = Q \times P$$
  $$\text{Base Tributável} = \text{Subtotal do Item} - D$$
  $$\text{Valor do Imposto} = \text{Base Tributável} \times I$$
  $$\text{Total do Item} = \text{Base Tributável} + \text{Valor do Imposto}$$

---

## 📦 3. Regras de Negócio — Módulo de Stock

O controle de estoque é estritamente baseado em eventos históricos de movimentação.

1. **Quantidade Atual como Histórico**: A quantidade de um produto em estoque nunca é editada diretamente. Ela é o resultado acumulado dos movimentos de entrada, saída e ajuste:
   $$\text{Estoque Atual} = \sum(\text{Entradas}) - \sum(\text{Saídas}) + \sum(\text{Ajustes})$$
2. **Imutabilidade de Movimentações**: Movimentos de estoque salvos não podem ser editados ou excluídos. Correções de erros devem ser feitas gerando um novo movimento compensatório (ex: uma saída corretiva para reverter uma entrada incorreta).
3. **Validação de Estoque Negativo**: Dependendo da parametrização do sistema, saídas que resultem em saldo negativo são bloqueadas.
4. **Alertas de Estoque Mínimo**: Se o estoque atual de um produto ficar igual ou abaixo do `minStock`, o sistema gera alertas informativos, mas não bloqueia a venda/saída.

---

## 💰 4. Regras de Negócio — Módulo de Tesouraria

O módulo de tesouraria gerencia os fluxos financeiros de caixa e banco da organização.

1. **Transações via Movimentações**: O saldo de uma conta financeira (`CAIXA` ou `BANCO`) é atualizado unicamente através de movimentos financeiros do tipo `ENTRADA` (Receita), `SAÍDA` (Despesa) ou `TRANSFERENCIA`.
2. **Transferências Inter-contas**: Transferências movem recursos entre duas contas distintas da mesma organização. Elas ocorrem em uma transação de banco de dados única (atômica) que debita da conta de origem e credita na conta de destino.
3. **Reconciliação Bancária**: Lançamentos podem ser vinculados a linhas de extratos importados (`BankStatementLine`), mudando o status de conciliação para `isReconciled = true`.

---

## ⚙️ 5. Parametrização e Configurações Globais

Para que a faturação e os processos financeiros funcionem, o sistema utiliza tabelas de parametrização:

1. **Séries de Faturação (`InvoiceSeries`)**:
   * Permite criar múltiplos canais de numeração. Cada série define um prefixo e ano de exercício (ex: Série A-2026, Série B-2026).
2. **Regras de Impostos (`TaxRule`)**:
   * Parametrização das taxas aplicadas aos produtos ou serviços. Podem ser do tipo `TAX` (imposto), `RETENTION` (retenção na fonte) ou `EXEMPTION` (isenção).
   * O escopo pode ser global, por cliente, por categoria de cliente, por serviço ou categoria de serviço.
3. **Plano de Subscrição (`Plan` e `Module`)**:
   * Definições do catálogo de planos do SaaS com preços e mapeamento de módulos ativados.
