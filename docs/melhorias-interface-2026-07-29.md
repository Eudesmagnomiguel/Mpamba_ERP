# Melhorias de Interface — 29/07/2026

## Contexto

Pedido: melhorar a interface do `mpamba-frontend` por completo, tornando-a diferente,
inovadora e profissional. A investigação inicial mostrou que já existia um sistema de
identidade visual bem pensado em `globals.css` (paleta azul-marinho → verde-esmeralda,
gradientes de marca, gráficos reais com recharts), mas estava **parcialmente aplicado**,
o que fazia a interface parecer inacabada. O trabalho concentrou-se em terminar essa
aplicação e elevar as telas de maior visibilidade.

## O que foi feito

### 1. Tipografia
- `app/layout.tsx`: removido um import morto/trocado (`Sora` nunca era instanciado; a
  variável chamada `sora` era na verdade `Inter`, e nenhum dos dois estava ligado a nada).
  Agora `Sora` é usada para títulos (`--font-heading`) e `Figtree` para o corpo
  (`--font-sans`), ambas via `next/font/google` (self-hosted, sem dependência de CDN em
  runtime).
- `globals.css`: removido o `@font-face` morto do `"TestSohne"` (apontava para
  `/fonts/TestSohne-*.otf`, ficheiros que não existem no repositório) e adicionado
  `--font-heading` ao bridge `@theme inline`. Regra nova em `@layer base` aplica
  `font-heading` a `h1, h2, h3, h4` em toda a app automaticamente.

### 2. Cor — conclusão do rebrand
Substituída a cor roxa antiga (`#584BBD`, `#272264`, `#303f61` e variações de shadow/hover)
pelos tokens de marca (`text-primary`, `text-foreground`, `bg-primary`, etc.) em 12+
ficheiros: `Input.tsx`, `PlanForm.tsx`, `OTPInput.tsx`, `ModuleStep.tsx`, modais de
clientes/utilizadores, `billing/taxes`, `billing/services`, `admin/settings`,
`SeriesModal.tsx`, dashboard `/core`, dashboard de stock, header do módulo.

Adicionados os tokens `--chart-1` a `--chart-5` ao bridge do Tailwind (existiam no CSS mas
nunca geravam classes utilitárias) e usados para cores de stat-tiles e módulos.

### 3. Componentes
- Unificados os `<select>` nativos mais visíveis (selector de período no dashboard de
  faturação, ciclo/cor/estado no `PlanForm`) para o componente `Select` partilhado
  (Radix/shadcn). Os restantes `<select>` nativos em formulários de CRUD (facturas,
  recibos, utilizadores, etc.) ficam para uma próxima ronda.
- Limpeza dos SVGs de exemplo do `create-next-app` em `public/` (não estavam a ser usados).

### 4. Dados reais em vez de mock
- **Dashboard `/core`**: stats (utilizadores, papéis, módulos activos, dias de subscrição
  restantes) passaram a vir de hooks já existentes, sem necessidade de novo endpoint.
- **Dashboard de Faturação**: gráfico de receita liga-se a `monthlyRevenue`, um campo novo
  calculado no backend (`stats.service.ts`, últimos 6 meses); o cartão "Volume de caixa"
  mostra o valor real de tesouraria quando o módulo está activo para a organização, com um
  estado alternativo honesto quando não está.

### 5. Responsividade
Grids de formulários que ficavam sempre em 2+ colunas mesmo em ecrãs pequenos passaram a
colapsar para 1 coluna em mobile: `PlanForm`, wizard de registo (`OrganizationStep`,
`AdminStep`), tesouraria (movimentos, contas), séries fiscais, novas facturas/proformas.
A infraestrutura de base (sidebar mobile, tabelas com `overflow-x-auto`, header com
elementos secundários escondidos em ecrãs pequenos) já estava bem construída.

## Verificação

- `npx tsc --noEmit` limpo no backend e no frontend.
- 164/164 testes do backend a passar.
- Corrigido um bloqueio real de ambiente: faltava o binário nativo
  `@next/swc-win32-x64-msvc`, sem o qual `npm run dev` falhava (Next 16 usa Turbopack por
  defeito). Instalado.
- Servidor de desenvolvimento arrancado e confirmado no browser: `/signin`, `/core`,
  `/billing`, `/reset-password` e a edição de planos respondem 200 sem erros; a fonte de
  títulos confirma-se aplicada no HTML/CSS compilado.

## Por tratar (próxima ronda, se desejado)

- Restantes `<select>` nativos em formulários de CRUD (facturas, recibos, utilizadores,
  admin/subscriptions, etc.).
- `npm audit` do frontend reportou 16 vulnerabilidades (2 baixas, 5 moderadas, 9 altas) —
  não investigado nesta ronda.
- Testar os fluxos com dados reais (login, facturas) continua dependente do Docker/Postgres
  estarem a correr.
