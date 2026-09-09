# Próximos passos

Estado em **9 de Setembro de 2026**, no fim da sessão que alinhou o plano de contas
com o PGC-Angola, acrescentou a validade dos produtos e produziu a documentação.

Este ficheiro é o ponto de retomada: o que está feito, o que falta, e as decisões
que ficaram à espera de quem as deve tomar.

---

## 1. Estado actual

### Commits nesta sessão

Todos em `main`, autoria `Eudesmagno Miguel <>`:

| Commit | Assunto |
|---|---|
| `86f36b4` | Alinha o plano de contas com o PGC-Angola (Decreto n.º 82/01) |
| `db64e4c` | Valida as contas e a data no registo de lançamentos |
| `396d142` | Corrige as permissões do registo de clientes |
| `ba4d84c` | Permite registar a data de validade dos produtos |
| `8664e76` | Aplica as migrações no build do Vercel |
| `ae71d0f` | Acrescenta o manual do utilizador em PDF |
| `a45e510` | Acrescenta a documentação técnica em PDF |

### O que já está em produção

- **Backend (`mpamba-api`)** — deployado, com as três migrações novas aplicadas
  (`align_chart_of_accounts_pgc_angola`, `grant_customer_permissions_to_billing_roles`,
  `add_product_expiry_date`). Confirmado nos logs do build.
- **Frontend (`mpamba-erp-jx5d`)** — deployado automaticamente pelo push. Este
  projecto está ligado ao GitHub e deploya o `main` a cada push.

### O que não está em produção

Os dois últimos commits (`ae71d0f`, `a45e510`) são só documentação e **ainda não
foram enviados** para o GitHub.

---

## 2. Pendente imediato

### 2.1 Enviar os commits de documentação

```bash
git push origin main
```

> **Atenção:** este push dispara o deploy automático do frontend
> (`mpamba-erp-jx5d`). Como os dois commits só tocam em `docs/`, o deploy é
> inofensivo — mas é um deploy real de produção.

### 2.2 Migrar a base de dados local

Nunca foi feito: o Docker Desktop não subiu durante a sessão (o daemon não
respondeu em 5 minutos). A base local continua sem as três migrações.

```bash
cd mpamba-backend
npm run docker:up
npm run db:migrate
```

Se o daemon não arrancar, normalmente é o WSL2: `wsl --shutdown` e reabrir o
Docker Desktop.

### 2.3 Verificar a renumeração do plano de contas em produção

**A migração do plano de contas nunca correu contra uma base de dados antes de
produção**, porque não houve ambiente local. A sintaxe foi validada e as colisões
de código analisadas conta a conta, mas a correcção *semântica* — os saldos terem
caído nas contas certas — só se confirma olhando.

Abrir o **Balancete** de uma organização com movimentos e confirmar:

| Saldo de… | Deve estar em |
|---|---|
| Caixa | `45.1` Fundo fixo |
| Banco | `43.1` Depósitos à ordem — moeda nacional |
| Clientes | `31.1` Clientes — correntes |
| IVA liquidado | `34.5.3` |
| Vendas | `61.3` Mercadorias |
| CMV | `71.6` Mercadorias |

Contas de 1 dígito que tenham ficado (só acontece se tivessem lançamentos
manuais) aparecem com o nome sufixado `(plano antigo)` e devem ser
reclassificadas à mão.

---

## 3. Decisões à espera

### 3.1 Permissões inconsistentes entre constantes e seed

Encontrado ao levantar o RBAC para a documentação técnica. **Não corrigido**,
porque a decisão é de desenho.

**14 constantes sem linha em `PERMISSIONS_LIST`** — um `permissionGuard` sobre
qualquer delas falharia sempre, porque o `rbacService` procura a permissão na
base de dados. Nenhuma está em uso em rotas, por isso não há bug activo:

```
organization_module:create|view|update|delete
plan_module:create|view|update|delete
user_role:create|view|update|delete
role_permission:create|delete
```

**5 permissões semeadas sem constante** — existem na base de dados mas não há
constante para as usar num guard. As rotas de serviços usam hoje `invoice:create`:

```
billing:service:create|view|update|delete
billing:setting:update
```

Caminhos possíveis:

- **(a)** Semear as 14 que faltam e criar as constantes das 5 — se a intenção é
  vir a usá-las.
- **(b)** Apagar as 14 constantes mortas e semear as 5 restantes com constante —
  se a intenção é limpar.

Ficheiros: `mpamba-backend/prisma/seed/permissions.ts`,
`mpamba-backend/src/shared/utils/rbac/permission.constants.ts`,
`mpamba-frontend/src/shared/constants/permission.constants.ts`.

### 3.2 Projecto Vercel duplicado no frontend

Existem três projectos: `mpamba-api` (backend), `mpamba-erp-jx5d` (frontend em
produção, ligado ao Git) e **`mpamba-erp`** — duplicado, cujo domínio já não
resolve.

O `mpamba-frontend/.vercel` local aponta para o duplicado, e é por isso que
`vercel --prod` a partir de `mpamba-frontend` falha com *Root Directory
"mpamba-frontend" does not exist*.

Como o `jx5d` deploya sozinho pelo Git, o CLI não é necessário para o frontend.
Mas convém **apagar o projecto duplicado ou corrigir a ligação local**, para não
voltar a confundir quem tentar um deploy manual.

### 3.3 Vender produto expirado: bloquear ou avisar?

A validade é registada e sinalizada, mas a facturação e o POS **não impedem nem
avisam** ao vender um produto expirado. É uma decisão de negócio:

- bloquear a emissão;
- avisar e deixar prosseguir;
- deixar como está.

---

## 4. Dívida técnica conhecida

| Item | Detalhe |
|---|---|
| **Numeração por `count + 1`** | `JournalEntry.number` e outros contadores usam `count(...) + 1` sem índice único, pelo que podem duplicar sob concorrência. A correcção é índice único mais repetição em caso de conflito. |
| **Validade por produto, não por lote** | `Product.expiryDate` é um campo único. Vários lotes com validades diferentes exigiriam uma tabela de lotes com quantidade e validade próprias, e saídas por FEFO — é uma reformulação do módulo de stock. |
| **Integração não retroactiva** | Um documento emitido enquanto o módulo de destino estava inactivo não é reprocessado ao activá-lo. O event bus é em memória e por instância; garantias de entrega exigiriam fila persistente. |
| **Cobertura Swagger desigual** | As rotas mais recentes têm anotações `@swagger`, outras não. |
| **Sem testes de contabilidade antes desta sessão** | Foram acrescentados 30 (plano de contas, lançamentos, validade). Outros módulos podem ter lacunas semelhantes. |

---

## 5. Melhorias sugeridas

Nenhuma é necessária; ficam registadas para não se perderem.

- **Filtro por estado de validade** na listagem de produtos (`expiryStatus` como
  parâmetro de `findAllProducts`). Os contadores e as etiquetas já existem; falta
  poder filtrar.
- **Números de página no índice dos PDFs.** Hoje o índice tem ligações clicáveis
  mas não páginas. Calculá-los exige duas passagens de renderização (render →
  ler onde cada secção caiu → injectar → render). Só vale a pena se os documentos
  forem impressos e distribuídos em papel.
- **Manual do utilizador acessível de dentro da plataforma**, como se fez com o
  decreto do PGC (ficheiro em `mpamba-frontend/public/` e um botão no ecrã).
- **Separar vendas de serviços na nota de crédito.** A factura já reparte o rédito
  entre `61.3` e `62.1` pelas linhas com `serviceId`; a nota de crédito credita
  tudo a `61.3`, porque o `CreditNote` não tem itens.

---

## 6. Como regenerar a documentação

As fontes são os HTML em `docs/`. Depois de editar:

```bash
node docs/build-manual-pdf.mjs                       # manual do utilizador
node docs/build-manual-pdf.mjs docs/documentacao-tecnica.html \
                               docs/Documentacao-Tecnica-Mpamba.pdf
```

Usa o Chrome instalado, conduzido pelo DevTools Protocol. Não instala
dependências.

---

## 7. Verificações antes de qualquer deploy

```bash
cd mpamba-backend  && npx tsc --noEmit && npm test    # 257 testes
cd ../mpamba-frontend && npx tsc --noEmit && npm run build
```

Ordem de deploy: numa alteração que mude o contrato entre frontend e API,
**deploye a API primeiro** — o push para `main` deploya o frontend sozinho e
abre uma janela em que a interface nova fala com a API antiga.
