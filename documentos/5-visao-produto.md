# Visão do Produto

Este documento resume a visão estratégica do **Mpamba**, para orientar decisões de arquitetura, priorização e design ao longo do desenvolvimento.

---

## 🎯 Visão

Desenvolver um software moderno, inteligente e inovador, que se diferencie dos produtos atualmente disponíveis no mercado angolano. O objetivo não é criar "mais um software de faturação", mas sim uma **plataforma de gestão empresarial** capaz de atender empresas de qualquer dimensão e de qualquer ramo de atividade.

## 📌 Fase Atual

O foco imediato está nos módulos de **Faturação** e **Tesouraria**. Toda a arquitetura deve, no entanto, ser preparada desde já para permitir a integração futura de:

- Contabilidade
- Recursos Humanos
- Gestão de Stock *(já existe uma base inicial no sistema)*
- Compras
- Vendas
- CRM
- Produção
- outros módulos a definir

> Implicação arquitetural: manter o modelo modular já existente (`Module`, `OrganizationModule`, `PlanModule` no schema Prisma) como o mecanismo central de activação/desactivação de funcionalidades por organização e por plano, em vez de acoplar lógica de negócio entre módulos.

## ✅ Requisitos Não Funcionais (o que se espera do software)

- **Simplicidade**: interface intuitiva, utilizável por pessoas sem conhecimentos avançados de informática.
- **Adaptabilidade**: servir comércio, prestação de serviços, indústria, farmácias, restaurantes, boutiques, clínicas, oficinas, supermercados, etc.
- **Conformidade fiscal**: cumprir integralmente a legislação fiscal angolana, com capacidade de atualização rápida quando houver alterações legais.
- **Segurança**: controlo de acessos granular e registo de auditoria de todas as operações.
- **Desempenho**: rápido e estável mesmo com grandes volumes de dados.
- **Parametrização**: cada empresa deve conseguir configurar o sistema à sua realidade.

## ⭐ Funcionalidades Diferenciadoras (roadmap de referência)

- Dashboard inteligente com indicadores financeiros em tempo real.
- Tesouraria totalmente integrada com a faturação.
- Controlo diário de caixa, bancos, receitas, despesas e reconciliação bancária.
- Aprovação eletrónica de pagamentos e despesas.
- Gestão de múltiplas caixas, contas bancárias e filiais.
- Emissão de documentos de forma rápida e personalizada.
- Alertas automáticos para cobranças, pagamentos, documentos vencidos e saldos críticos.
- Relatórios financeiros e gráficos dinâmicos para apoio à decisão.
- Pesquisa rápida em todo o sistema.
- Digitalização e anexação de documentos.
- Histórico completo das operações realizadas.
- Sistema de permissões por utilizador, função e departamento.
- Backup automático e mecanismos de recuperação de dados.
- Integração futura com bancos, AT (Administração Tributária), pagamentos eletrónicos e outros sistemas.
- Funcionamento em rede, via Web e na Cloud, com acesso remoto seguro.
- API para integração com aplicações externas.

## 🏆 Objetivo Principal

Tornar-se uma referência no mercado angolano, destacando-se pela inovação, facilidade de utilização, inteligência das funcionalidades, segurança, rapidez e flexibilidade — sendo uma solução competitiva não apenas em Angola, mas preparada para outros mercados africanos.

## 🎨 Identidade Visual

A interface deve transmitir seriedade financeira e modernidade tecnológica, evitando o aspeto genérico de templates — ver paleta de cores e gradientes de marca definidos em `mpamba-frontend/src/assets/styles/globals.css` (tokens `--primary`, `--accent-teal` e `--gradient-brand`).
