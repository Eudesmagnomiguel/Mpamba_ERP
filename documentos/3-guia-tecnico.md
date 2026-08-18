# Guia Técnico e GPS da API

Este guia é voltado para desenvolvedores que darão manutenção ou estenderão as funcionalidades do sistema **Mpamba**. Ele descreve a arquitetura técnica, o mapeamento do banco de dados e fornece um guia de rotas (GPS) da API.

---

## 🛠️ Stack Tecnológico

### Backend
* **Runtime**: Node.js com TypeScript.
* **Framework Web**: Express (com suporte a ES Modules).
* **Banco de Dados Relacional**: PostgreSQL.
* **ORM**: Prisma Client.
* **Banco de Cache / Filas**: Redis.
* **Servidor HTTP de Desenvolvimento**: `tsx` (TypeScript Execute).
* **Testes**: Vitest (com cobertura de testes via `@vitest/coverage-v8`).
* **Documentação de API**: Swagger UI via `swagger-jsdoc` e `swagger-ui-express`.

### Frontend
* **Framework**: Next.js 16 (React 19) com roteamento baseado em `/src/app`.
* **Estilização**: Tailwind CSS v4, Framer Motion (animações) e Shadcn UI.
* **Gerenciamento de Estado**: Zustand.
* **Consumo de API**: TanStack React Query (v5) e Axios.

---

## 📁 Estrutura de Diretórios

### Backend (`mpamba-backend`)
```
mpamba-backend/
├── prisma/                  # Configurações do Prisma (schema.prisma, migrações e sementes)
└── src/
    ├── config/              # Inicializações (Banco de dados, Redis, Swagger, E-mail)
    ├── controller/          # Controladores HTTP (Gerenciam requisições e respostas)
    ├── middleware/          # Middlewares (Autenticação, Cache, Guardas de Planos)
    ├── routes/              # Definições de rotas da API (Core e Módulos)
    │   ├── core/            # Rotas de Autenticação, Planos e Subscrições
    │   └── module/          # Rotas operacionais (Billing, Stock, Treasury)
    ├── services/            # Camada de Regras de Negócio (Consultas ao Prisma)
    ├── shared/              # Utilitários, Tipagem e DTOs compartilhados
    ├── app.ts               # Arquivo de configuração do Express
    └── server.ts            # Ponto de entrada que inicializa o servidor na porta
```

### Frontend (`mpamba-frontend`)
```
mpamba-frontend/
└── src/
    ├── app/                 # Páginas e roteamento do Next.js
    ├── components/          # Componentes visuais organizados por módulo (ui, stock, billing)
    ├── hooks/               # Custom hooks do React Query organizados por módulo
    ├── lib/                 # Configurações de bibliotecas (Axios, utils)
    ├── providers/           # Provedores React (QueryProvider, ModuleProvider)
    ├── services/            # Serviços de integração direta com a API
    └── shared/              # DTOs, tipos, constantes e utilitários
```

---

## 💾 Mapeamento de Entidades do Banco de Dados (Prisma)

As tabelas no arquivo [schema.prisma](file:///c:/Users/LGC%20CONSULTING/Downloads/Mpamba-main/mpamba-backend/prisma/schema.prisma) dividem-se logicamente em:

1. **Gestão do SaaS e Acesso**:
   * `User`, `Organization`, `Role`, `Permission`, `UserRole`, `RolePermission`.
   * `Plan`, `PlanModule`, `Module`, `OrganizationModule` (Controle granular de acesso).
   * `Subscription`, `SubscriptionRequest`, `ActivationCode` (Status comercial).
2. **Módulo de Faturação**:
   * `Customer`, `Service`, `TaxRule`, `InvoiceSeries`.
   * `Invoice`, `InvoiceItem`, `Proforma`, `ProformaItem`, `CreditNote`, `CreditNoteItem`, `Receipt`.
3. **Módulo de Estoque**:
   * `Product`, `ProductCategory`, `Supplier`, `StockMovement` (Relacionado a produtos, usuários e fornecedores).
4. **Módulo de Tesouraria**:
   * `FinancialAccount`, `FinancialCategory`, `FinancialMovement` (Transações de entrada/saída).
   * `BankStatement`, `BankStatementLine` (Extratos para reconciliação).
   * `CostCenter`, `ExchangeRate`, `Payable` (Contas a Pagar), `Receivable` (Contas a Receber).

---

## 🗺️ GPS da API (Mapeamento de Rotas)

Todas as rotas da API estão sob o prefixo `/api`. O arquivo principal de montagem é o [app.ts](file:///c:/Users/LGC%20CONSULTING/Downloads/Mpamba-main/mpamba-backend/src/app.ts).

### 1. Rotas do Núcleo do SaaS (`core`)

| Método | Endpoint | Middleware de Guarda | Descrição |
|---|---|---|---|
| **POST** | `/api/auth/register` | Nenhum | Cadastro de nova organização + usuário admin principal. |
| **POST** | `/api/auth/login` | Nenhum | Autenticação do usuário. Retorna o token JWT e Refresh Token. |
| **POST** | `/api/auth/refresh` | Nenhum | Renova o token JWT de acesso expirado. |
| **GET** | `/api/plans` | `authMiddleware` | Lista os planos de subscrição cadastrados no sistema. |
| **POST** | `/api/plans` | `authMiddleware` (Super Admin) | Criação de novos planos de subscrição. |
| **GET** | `/api/subscription/status` | `authMiddleware` | Verifica o estado da subscrição atual da organização ativa. |
| **POST** | `/api/subscription-requests` | `authMiddleware` | Solicita upgrade, downgrade ou renovação de plano. |

### 2. Rotas do Módulo de Faturação (`/api/billing`)

*Estas rotas exigem a autenticação do usuário e passam pelo `moduleGuard('billing')` e `subscriptionGuard`.*

| Método | Endpoint | Descrição |
|---|---|---|
| **GET** | `/api/billing/invoices` | Lista faturas da organização (com suporte a filtros). |
| **POST** | `/api/billing/invoices` | Cria uma nova fatura em estado `DRAFT` (rascunho). |
| **GET** | `/api/billing/invoices/:id` | Detalhes de uma fatura específica. |
| **PUT** | `/api/billing/invoices/:id` | Atualiza uma fatura (válido apenas se estiver em `DRAFT`). |
| **POST** | `/api/billing/invoices/:id/issue` | Emite oficialmente a fatura (muda para `ISSUED` e gera sequência fiscal). |
| **POST** | `/api/billing/invoices/:id/cancel` | Cancela uma fatura emitida (muda para `CANCELLED` e exige motivo). |
| **POST** | `/api/billing/invoices/:id/duplicate` | Cria uma cópia da fatura como `DRAFT`. |
| **GET** | `/api/billing/invoices/:id/pdf` | Gera e exporta o arquivo PDF oficial da fatura. |
| **POST** | `/api/billing/invoices/:id/send` | Envia a fatura e o PDF anexo por e-mail para o cliente. |
| **GET** | `/api/billing/customers` | CRUD de Clientes. |
| **GET** | `/api/billing/services` | Catálogo de Serviços faturáveis. |
| **GET** | `/api/billing/series` | Gestão de séries de numeração ativa. |

### 3. Rotas do Módulo de Estoque (`/api/stock`)

*Estas rotas exigem a autenticação do usuário e passam pelo `moduleGuard('stock')` e `subscriptionGuard`.*

| Método | Endpoint | Descrição |
|---|---|---|
| **GET** | `/api/stock/products` | Lista produtos cadastrados e quantidade em estoque atual. |
| **POST** | `/api/stock/products` | Cria novo produto (SKU deve ser único na organização). |
| **GET** | `/api/stock/movements` | Histórico completo de movimentações de estoque. |
| **POST** | `/api/stock/movements` | Registra uma nova movimentação do tipo `ENTRADA`, `SAIDA` ou `AJUSTE`. |
| **GET** | `/api/stock/reports/low-stock` | Lista produtos que atingiram ou estão abaixo do estoque mínimo. |

### 4. Rotas do Módulo de Tesouraria (`/api/treasury`)

*Estas rotas exigem a autenticação do usuário e passam pelo `moduleGuard('treasury')` e `subscriptionGuard`.*

| Método | Endpoint | Descrição |
|---|---|---|
| **GET** | `/api/treasury/accounts` | Lista contas financeiras (Caixa e Bancos) e saldos atuais. |
| **POST** | `/api/treasury/accounts` | Cria uma nova conta financeira. |
| **GET** | `/api/treasury/movements` | Histórico de lançamentos financeiros (Entradas e Saídas). |
| **POST** | `/api/treasury/movements` | Registra uma movimentação financeira atrelada a uma conta e categoria. |
| **POST** | `/api/treasury/movements/transfer` | Executa transferência de recursos entre duas contas distintas. |
| **GET** | `/api/treasury/payables` | Controle de Contas a Pagar. |
| **GET** | `/api/treasury/receivables` | Controle de Contas a Receber (geradas ou não via faturamento). |

---

## 🔒 Middlewares Chave no Fluxo

* **`authMiddleware`**: Valida o header `Authorization: Bearer <JWT_TOKEN>`. Decodifica o payload e anexa as informações do usuário ativo (`req.user`) na requisição.
* **`moduleGuard(moduleCode)`**: Executado nas rotas modulares. Ele busca no cache ou banco as permissões da organização e valida se o código do módulo informado (ex: `stock`) está liberado para o plano contratado.
* **`subscriptionGuard`**: Executado em todas as rotas operacionais de escrita. Impede que organizações com faturas/planos vencidos ou suspensos modifiquem dados (retorna `402`), protegendo os dados de leitura.
