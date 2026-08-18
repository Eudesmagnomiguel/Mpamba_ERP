# Como a Plataforma Mpamba Funciona

## O que é

Mpamba é uma plataforma de gestão empresarial (ERP modular) para pequenas e médias
empresas em Angola. Em vez de um sistema monolítico, é organizada em **módulos
independentes que se integram automaticamente entre si** quando activos na mesma
organização: Faturação, Stock e Tesouraria.

## Arquitectura em duas partes

- **`mpamba-frontend`** — aplicação web (Next.js) onde utilizadores fazem login e
  trabalham no dia-a-dia.
- **`mpamba-backend`** — API (Node.js/Express) que guarda os dados (PostgreSQL) e aplica
  as regras de negócio. Usa Redis para cache e um sistema de eventos interno para ligar
  os módulos entre si.

Cada organização (empresa cliente) tem os seus dados completamente isolados das outras.

## Contas e acesso

1. **Registo**: uma empresa regista-se escolhendo um plano. A organização fica
   **pendente** — não pode entrar ainda.
2. **Aprovação**: um Super Admin da Mpamba revê o pedido e aprova-o. É gerado um código
   de activação enviado por email ao administrador da empresa.
3. **Activação**: o administrador introduz o código, a organização fica activa e os
   módulos do plano contratado são ligados automaticamente.
4. **Login**: cada utilizador entra com email/senha. As senhas são guardadas com hash
   (bcrypt) — nunca em texto simples.
5. **Papéis e permissões (RBAC)**: dentro de cada organização há papéis (ex.:
   Administrador, Faturista) com permissões específicas (criar factura, ver stock,
   gerir utilizadores, etc.). Um utilizador só vê e faz o que o seu papel permite.
6. **Recuperação de senha**: pedido de recuperação por email → link com token válido
   por 1 hora → definição de nova senha.

## Planos e módulos

- A Mpamba define **planos** (ex.: Starter, Professional, Enterprise), cada um dando
  acesso a um conjunto de módulos.
- Um Super Admin pode activar módulos adicionais para uma organização específica.
- Se um módulo não estiver activo, as suas rotas/páginas ficam inacessíveis para essa
  organização — os módulos activos funcionam de forma **totalmente independente** uns
  dos outros (ex.: uma empresa só de Faturação, sem Stock, continua a funcionar
  normalmente).

## Os três módulos

### Faturação
Gestão de clientes, séries de documentos fiscais (numeração sequencial por ano),
facturas, proformas, recibos e notas de crédito. Ciclo de vida de um documento:
rascunho → emitido (número oficial, imutável) → pago/cancelado. Suporta impostos (IVA),
descontos, múltiplas moedas e geração de PDF.

### Stock
Produtos, categorias, fornecedores e movimentos de inventário (entradas, saídas,
ajustes, reversões). Cada movimento fica registado com quantidade, motivo e utilizador
responsável, para auditoria.

### Tesouraria
Contas financeiras (caixa/banco), categorias de receita/despesa e lançamentos
(entradas e saídas). Relatórios de resumo por período.

## Como os módulos se falam (integração automática)

Quando um módulo emite um evento interno, os outros módulos activos reagem sozinhos,
sem intervenção manual:

- **Fatura emitida** → se Stock estiver activo, dá baixa automática nos produtos
  vendidos.
- **Recibo emitido** (pagamento confirmado) → se Tesouraria estiver activo, regista
  uma entrada de dinheiro.
- **Nota de crédito emitida** → regista uma saída (reembolso) na Tesouraria.
- **Fatura cancelada** → estorna automaticamente o stock que tinha sido baixado e a
  entrada financeira associada, mantendo os três módulos sempre consistentes entre si.

## Painéis principais

- **`/core`** — painel do administrador da organização: utilizadores, papéis, módulos
  activos, estado da subscrição.
- **`/billing`, `/stock`, `/treasury`** — painel de cada módulo, com indicadores
  principais e gráficos de desempenho baseados em dados reais.
- **`/admin`** — área do Super Admin da Mpamba: aprovação de organizações, gestão de
  planos e módulos disponíveis na plataforma.

## Resumo do percurso de um utilizador novo

Regista a empresa → aguarda aprovação → recebe código por email → activa a conta →
entra com email/senha → é encaminhado automaticamente para o painel certo consoante o
seu papel e os módulos contratados pela empresa.
