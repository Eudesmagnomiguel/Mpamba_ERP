export type AccountSide = 'ATIVO' | 'PASSIVO' | 'CAPITAL_PROPRIO' | 'CUSTO' | 'PROVEITO';

export interface DefaultAccountTemplate {
	code: string;
	name: string;
	side: AccountSide;
}

/**
 * Plano de contas por defeito — PGC-Angola, Decreto n.º 82/01 de 16 de Novembro
 * (ver `docs/PGC_Decreto_nº82_01_ATF ediçõestécnicas.pdf`).
 *
 * As classes seguem a ordem do decreto, que as trocou face ao plano anterior:
 * 1 Meios Fixos, 2 Existências, 3 Terceiros, 4 Meios Monetários, 5 Capital e
 * Reservas, 6 Proveitos, 7 Custos, 8 Resultados. A classe 0 (contas de ordem) e
 * a classe 9 (contabilidade analítica) são de uso facultativo e não são semeadas.
 *
 * `class` e o código-pai são derivados do próprio código (ver `accountClassOf` e
 * `parentCodeOf`), pelo que não se repetem em cada linha.
 *
 * O decreto não cria contas de 1 dígito: «1 — Meios fixos e investimentos» é o
 * título da classe, não uma conta. A hierarquia começa por isso nas contas de
 * 2 dígitos, e o agrupamento por classe é feito pela interface.
 *
 * `side` classifica cada conta para o Balanço e a Demonstração de Resultados.
 * A classe 3 «Terceiros» mistura Activo (Clientes) com Passivo (Fornecedores,
 * Estado), por isso a classificação é explícita conta a conta. As contas
 * retificativas (18 Amortizações acumuladas, 29/38 Provisões) ficam do lado da
 * rubrica que reduzem, para que o respetivo saldo credor a abata no Balanço.
 *
 * Duas contas não constam da lista do decreto e ocupam «linhas em branco», que o
 * ponto 2.2 das disposições gerais permite preencher:
 *   - 34.5 IVA e sub-contas — o IVA só foi criado em 2019 (Lei n.º 7/19) e a
 *     linha 34.5 estava vaga entre 34.4 (Imposto de circulação) e 34.8.
 *   - 71.6 Mercadorias — o título da conta 71 é «Custo das mercadorias vendidas
 *     e das matérias consumidas», mas a lista detalhada salta de 71.5 para 71.9.
 */
export const DEFAULT_ACCOUNTS: DefaultAccountTemplate[] = [
	// ─── CLASSE 1 — MEIOS FIXOS E INVESTIMENTOS ──────────────────────────────
	{ code: '11', name: 'Imobilizações corpóreas', side: 'ATIVO' },
	{ code: '11.1', name: 'Terrenos e recursos naturais', side: 'ATIVO' },
	{ code: '11.2', name: 'Edifícios e outras construções', side: 'ATIVO' },
	{ code: '11.3', name: 'Equipamento básico', side: 'ATIVO' },
	{ code: '11.4', name: 'Equipamento de carga e transporte', side: 'ATIVO' },
	{ code: '11.5', name: 'Equipamento administrativo', side: 'ATIVO' },
	{ code: '11.6', name: 'Taras e vasilhame', side: 'ATIVO' },
	{ code: '11.9', name: 'Outras imobilizações corpóreas', side: 'ATIVO' },

	{ code: '12', name: 'Imobilizações incorpóreas', side: 'ATIVO' },
	{ code: '12.1', name: 'Trespasses', side: 'ATIVO' },
	{ code: '12.2', name: 'Despesas de investigação e desenvolvimento', side: 'ATIVO' },
	{ code: '12.3', name: 'Propriedade industrial e outros direitos e contratos', side: 'ATIVO' },
	{ code: '12.4', name: 'Despesas de constituição', side: 'ATIVO' },
	{ code: '12.9', name: 'Outras imobilizações incorpóreas', side: 'ATIVO' },

	{ code: '13', name: 'Investimentos financeiros', side: 'ATIVO' },
	{ code: '13.1', name: 'Empresas subsidiárias', side: 'ATIVO' },
	{ code: '13.2', name: 'Empresas associadas', side: 'ATIVO' },
	{ code: '13.3', name: 'Outras empresas', side: 'ATIVO' },
	{ code: '13.4', name: 'Investimentos em imóveis', side: 'ATIVO' },
	{ code: '13.5', name: 'Fundos', side: 'ATIVO' },
	{ code: '13.9', name: 'Outros investimentos financeiros', side: 'ATIVO' },

	{ code: '14', name: 'Imobilizações em curso', side: 'ATIVO' },
	{ code: '14.1', name: 'Obra em curso', side: 'ATIVO' },
	{ code: '14.7', name: 'Adiantamentos por conta de imobilizado corpóreo', side: 'ATIVO' },
	{ code: '14.8', name: 'Adiantamentos por conta de imobilizado incorpóreo', side: 'ATIVO' },
	{ code: '14.9', name: 'Adiantamentos por conta de investimentos financeiros', side: 'ATIVO' },

	{ code: '18', name: 'Amortizações acumuladas', side: 'ATIVO' },
	{ code: '18.1', name: 'Imobilizações corpóreas', side: 'ATIVO' },
	{ code: '18.2', name: 'Imobilizações incorpóreas', side: 'ATIVO' },
	{ code: '18.3', name: 'Investimentos financeiros em imóveis', side: 'ATIVO' },

	{ code: '19', name: 'Provisões para investimentos financeiros', side: 'ATIVO' },

	// ─── CLASSE 2 — EXISTÊNCIAS ──────────────────────────────────────────────
	{ code: '21', name: 'Compras', side: 'ATIVO' },
	{ code: '21.1', name: 'Matérias-primas, subsidiárias e de consumo', side: 'ATIVO' },
	{ code: '21.2', name: 'Mercadorias', side: 'ATIVO' },
	{ code: '21.7', name: 'Devoluções de compras', side: 'ATIVO' },
	{ code: '21.8', name: 'Descontos e abatimentos em compras', side: 'ATIVO' },

	{ code: '22', name: 'Matérias-primas, subsidiárias e de consumo', side: 'ATIVO' },
	{ code: '23', name: 'Produtos e trabalhos em curso', side: 'ATIVO' },
	{ code: '24', name: 'Produtos acabados e intermédios', side: 'ATIVO' },
	{ code: '25', name: 'Sub-produtos, desperdícios, resíduos e refugos', side: 'ATIVO' },
	{ code: '26', name: 'Mercadorias', side: 'ATIVO' },
	{ code: '27', name: 'Matérias-primas, mercadorias e outros materiais em trânsito', side: 'ATIVO' },
	{ code: '28', name: 'Adiantamentos por conta de compras', side: 'ATIVO' },
	{ code: '29', name: 'Provisão para depreciação de existências', side: 'ATIVO' },

	// ─── CLASSE 3 — TERCEIROS ────────────────────────────────────────────────
	{ code: '31', name: 'Clientes', side: 'ATIVO' },
	{ code: '31.1', name: 'Clientes – correntes', side: 'ATIVO' },
	{ code: '31.2', name: 'Clientes – títulos a receber', side: 'ATIVO' },
	{ code: '31.3', name: 'Clientes – títulos descontados', side: 'ATIVO' },
	{ code: '31.8', name: 'Clientes de cobrança duvidosa', side: 'ATIVO' },
	{ code: '31.9', name: 'Clientes – saldos credores', side: 'PASSIVO' },

	{ code: '32', name: 'Fornecedores', side: 'PASSIVO' },
	{ code: '32.1', name: 'Fornecedores – correntes', side: 'PASSIVO' },
	{ code: '32.2', name: 'Fornecedores – títulos a pagar', side: 'PASSIVO' },
	{ code: '32.8', name: 'Fornecedores – facturas em recepção e conferência', side: 'PASSIVO' },
	{ code: '32.9', name: 'Fornecedores – saldos devedores', side: 'ATIVO' },

	{ code: '33', name: 'Empréstimos', side: 'PASSIVO' },
	{ code: '33.1', name: 'Empréstimos bancários', side: 'PASSIVO' },
	{ code: '33.2', name: 'Empréstimos por obrigações', side: 'PASSIVO' },
	{ code: '33.3', name: 'Empréstimos por títulos de participação', side: 'PASSIVO' },
	{ code: '33.9', name: 'Outros empréstimos obtidos', side: 'PASSIVO' },

	{ code: '34', name: 'Estado', side: 'PASSIVO' },
	{ code: '34.1', name: 'Imposto sobre os lucros', side: 'PASSIVO' },
	{ code: '34.2', name: 'Imposto de produção e consumo', side: 'PASSIVO' },
	{ code: '34.3', name: 'Imposto de rendimento de trabalho', side: 'PASSIVO' },
	{ code: '34.4', name: 'Imposto de circulação', side: 'PASSIVO' },
	// 34.5 — linha em branco do decreto, preenchida com o IVA (Lei n.º 7/19)
	{ code: '34.5', name: 'Imposto sobre o valor acrescentado', side: 'PASSIVO' },
	{ code: '34.5.1', name: 'IVA suportado', side: 'ATIVO' },
	{ code: '34.5.2', name: 'IVA dedutível', side: 'ATIVO' },
	{ code: '34.5.3', name: 'IVA liquidado', side: 'PASSIVO' },
	{ code: '34.5.4', name: 'IVA regularizações', side: 'PASSIVO' },
	{ code: '34.5.5', name: 'IVA apuramento', side: 'PASSIVO' },
	{ code: '34.5.6', name: 'IVA a pagar', side: 'PASSIVO' },
	{ code: '34.5.7', name: 'IVA a recuperar', side: 'ATIVO' },
	{ code: '34.5.8', name: 'IVA reembolsos pedidos', side: 'ATIVO' },
	{ code: '34.5.9', name: 'IVA liquidações oficiosas', side: 'PASSIVO' },
	{ code: '34.8', name: 'Subsídios a preços', side: 'PASSIVO' },
	{ code: '34.9', name: 'Outros impostos', side: 'PASSIVO' },

	{ code: '35', name: 'Entidades participantes e participadas', side: 'PASSIVO' },
	{ code: '35.1', name: 'Entidades participantes', side: 'PASSIVO' },
	{ code: '35.2', name: 'Entidades participadas', side: 'ATIVO' },

	{ code: '36', name: 'Pessoal', side: 'PASSIVO' },
	{ code: '36.1', name: 'Pessoal – remunerações', side: 'PASSIVO' },
	{ code: '36.2', name: 'Pessoal – participação nos resultados', side: 'PASSIVO' },
	{ code: '36.3', name: 'Pessoal – adiantamentos', side: 'ATIVO' },
	{ code: '36.9', name: 'Pessoal – outros', side: 'PASSIVO' },

	{ code: '37', name: 'Outros valores a receber e a pagar', side: 'ATIVO' },
	{ code: '37.1', name: 'Compras de imobilizado', side: 'PASSIVO' },
	{ code: '37.2', name: 'Vendas de imobilizado', side: 'ATIVO' },
	{ code: '37.3', name: 'Proveitos a facturar', side: 'ATIVO' },
	{ code: '37.4', name: 'Encargos a repartir por períodos futuros', side: 'ATIVO' },
	{ code: '37.5', name: 'Encargos a pagar', side: 'PASSIVO' },
	{ code: '37.6', name: 'Proveitos a repartir por períodos futuros', side: 'PASSIVO' },
	{ code: '37.7', name: 'Contas transitórias', side: 'ATIVO' },
	{ code: '37.9', name: 'Outros valores a receber e a pagar', side: 'ATIVO' },

	{ code: '38', name: 'Provisões para cobranças duvidosas', side: 'ATIVO' },
	{ code: '39', name: 'Provisões para outros riscos e encargos', side: 'PASSIVO' },

	// ─── CLASSE 4 — MEIOS MONETÁRIOS ─────────────────────────────────────────
	{ code: '41', name: 'Títulos negociáveis', side: 'ATIVO' },

	{ code: '42', name: 'Depósitos a prazo', side: 'ATIVO' },
	{ code: '42.1', name: 'Moeda nacional', side: 'ATIVO' },
	{ code: '42.2', name: 'Moeda estrangeira', side: 'ATIVO' },

	{ code: '43', name: 'Depósitos à ordem', side: 'ATIVO' },
	{ code: '43.1', name: 'Moeda nacional', side: 'ATIVO' },
	{ code: '43.2', name: 'Moeda estrangeira', side: 'ATIVO' },

	{ code: '44', name: 'Outros depósitos', side: 'ATIVO' },
	{ code: '44.1', name: 'Moeda nacional', side: 'ATIVO' },
	{ code: '44.2', name: 'Moeda estrangeira', side: 'ATIVO' },

	{ code: '45', name: 'Caixa', side: 'ATIVO' },
	{ code: '45.1', name: 'Fundo fixo', side: 'ATIVO' },
	{ code: '45.2', name: 'Valores para depositar', side: 'ATIVO' },
	{ code: '45.3', name: 'Valores destinados a pagamentos específicos', side: 'ATIVO' },

	{ code: '48', name: 'Conta transitória', side: 'ATIVO' },
	{ code: '49', name: 'Provisões para aplicações de tesouraria', side: 'ATIVO' },

	// ─── CLASSE 5 — CAPITAL E RESERVAS ───────────────────────────────────────
	{ code: '51', name: 'Capital', side: 'CAPITAL_PROPRIO' },
	{ code: '52', name: 'Acções/quotas próprias', side: 'CAPITAL_PROPRIO' },
	{ code: '53', name: 'Prémios de emissão', side: 'CAPITAL_PROPRIO' },
	{ code: '54', name: 'Prestações suplementares', side: 'CAPITAL_PROPRIO' },
	{ code: '55', name: 'Reservas legais', side: 'CAPITAL_PROPRIO' },
	{ code: '56', name: 'Reservas de reavaliação', side: 'CAPITAL_PROPRIO' },
	{ code: '57', name: 'Reservas com fins especiais', side: 'CAPITAL_PROPRIO' },
	{ code: '58', name: 'Reservas livres', side: 'CAPITAL_PROPRIO' },

	// ─── CLASSE 6 — PROVEITOS E GANHOS POR NATUREZA ──────────────────────────
	{ code: '61', name: 'Vendas', side: 'PROVEITO' },
	{ code: '61.1', name: 'Produtos acabados e intermédios', side: 'PROVEITO' },
	{ code: '61.2', name: 'Sub-produtos, desperdícios, resíduos e refugos', side: 'PROVEITO' },
	{ code: '61.3', name: 'Mercadorias', side: 'PROVEITO' },
	{ code: '61.4', name: 'Embalagens de consumo', side: 'PROVEITO' },
	{ code: '61.5', name: 'Subsídios a preços', side: 'PROVEITO' },
	{ code: '61.7', name: 'Devoluções', side: 'PROVEITO' },
	{ code: '61.8', name: 'Descontos e abatimentos', side: 'PROVEITO' },

	{ code: '62', name: 'Prestações de serviços', side: 'PROVEITO' },
	{ code: '62.1', name: 'Serviços principais', side: 'PROVEITO' },
	{ code: '62.2', name: 'Serviços secundários', side: 'PROVEITO' },
	{ code: '62.8', name: 'Descontos e abatimentos', side: 'PROVEITO' },

	{ code: '63', name: 'Outros proveitos operacionais', side: 'PROVEITO' },
	{ code: '63.1', name: 'Serviços suplementares', side: 'PROVEITO' },
	{ code: '63.2', name: 'Royalties', side: 'PROVEITO' },
	{ code: '63.3', name: 'Subsídios à exploração', side: 'PROVEITO' },
	{ code: '63.4', name: 'Subsídios a investimento', side: 'PROVEITO' },
	{ code: '63.8', name: 'Outros proveitos e ganhos operacionais', side: 'PROVEITO' },

	{ code: '64', name: 'Variação nos inventários de produtos acabados e de produtos em vias de fabrico', side: 'PROVEITO' },
	{ code: '65', name: 'Trabalhos para a própria empresa', side: 'PROVEITO' },

	{ code: '66', name: 'Proveitos e ganhos financeiros gerais', side: 'PROVEITO' },
	{ code: '66.1', name: 'Juros', side: 'PROVEITO' },
	{ code: '66.2', name: 'Diferenças de câmbio favoráveis', side: 'PROVEITO' },
	{ code: '66.3', name: 'Descontos de pronto pagamento obtidos', side: 'PROVEITO' },
	{ code: '66.4', name: 'Rendimentos de investimentos em imóveis', side: 'PROVEITO' },
	{ code: '66.5', name: 'Rendimento de participações de capital', side: 'PROVEITO' },
	{ code: '66.6', name: 'Ganhos na alienação de aplicações financeiras', side: 'PROVEITO' },
	{ code: '66.7', name: 'Reposição de provisões', side: 'PROVEITO' },

	{ code: '67', name: 'Proveitos e ganhos financeiros em filiais e associadas', side: 'PROVEITO' },

	{ code: '68', name: 'Outros proveitos e ganhos não operacionais', side: 'PROVEITO' },
	{ code: '68.1', name: 'Reposição de provisões', side: 'PROVEITO' },
	{ code: '68.2', name: 'Anulação de amortizações extraordinárias', side: 'PROVEITO' },
	{ code: '68.3', name: 'Ganhos em imobilizações', side: 'PROVEITO' },
	{ code: '68.4', name: 'Ganhos em existências', side: 'PROVEITO' },
	{ code: '68.5', name: 'Recuperação de dívidas', side: 'PROVEITO' },
	{ code: '68.6', name: 'Benefícios de penalidades contratuais', side: 'PROVEITO' },
	{ code: '68.8', name: 'Descontinuidade de operações', side: 'PROVEITO' },
	{ code: '68.9', name: 'Alterações de políticas contabilísticas', side: 'PROVEITO' },
	{ code: '68.10', name: 'Correcções relativas a exercícios anteriores', side: 'PROVEITO' },
	{ code: '68.11', name: 'Outros ganhos e perdas não operacionais', side: 'PROVEITO' },

	{ code: '69', name: 'Proveitos e ganhos extraordinários', side: 'PROVEITO' },
	{ code: '69.1', name: 'Ganhos resultantes de catástrofes naturais', side: 'PROVEITO' },
	{ code: '69.2', name: 'Ganhos resultantes de convulsões políticas', side: 'PROVEITO' },
	{ code: '69.3', name: 'Ganhos resultantes de expropriações', side: 'PROVEITO' },
	{ code: '69.4', name: 'Ganhos resultantes de sinistros', side: 'PROVEITO' },
	{ code: '69.5', name: 'Subsídios', side: 'PROVEITO' },
	{ code: '69.6', name: 'Anulação de passivos não exigíveis', side: 'PROVEITO' },

	// ─── CLASSE 7 — CUSTOS E PERDAS POR NATUREZA ─────────────────────────────
	{ code: '71', name: 'Custo das mercadorias vendidas e das matérias consumidas', side: 'CUSTO' },
	{ code: '71.1', name: 'Matérias-primas', side: 'CUSTO' },
	{ code: '71.2', name: 'Matérias subsidiárias', side: 'CUSTO' },
	{ code: '71.3', name: 'Materiais diversos', side: 'CUSTO' },
	{ code: '71.4', name: 'Embalagens de consumo', side: 'CUSTO' },
	{ code: '71.5', name: 'Outros materiais', side: 'CUSTO' },
	// 71.6 — linha em branco do decreto; o título da conta 71 abrange mercadorias
	{ code: '71.6', name: 'Mercadorias', side: 'CUSTO' },

	{ code: '72', name: 'Custos com o pessoal', side: 'CUSTO' },
	{ code: '72.1', name: 'Remunerações – Órgãos sociais', side: 'CUSTO' },
	{ code: '72.2', name: 'Remunerações – Pessoal', side: 'CUSTO' },
	{ code: '72.3', name: 'Pensões', side: 'CUSTO' },
	{ code: '72.4', name: 'Prémios para pensões', side: 'CUSTO' },
	{ code: '72.5', name: 'Encargos sobre remunerações', side: 'CUSTO' },
	{ code: '72.6', name: 'Seguros de acidentes de trabalho e doenças profissionais', side: 'CUSTO' },
	{ code: '72.7', name: 'Formação', side: 'CUSTO' },
	{ code: '72.8', name: 'Outras despesas com o pessoal', side: 'CUSTO' },

	{ code: '73', name: 'Amortizações do exercício', side: 'CUSTO' },
	{ code: '73.1', name: 'Imobilizações corpóreas', side: 'CUSTO' },
	{ code: '73.2', name: 'Imobilizações incorpóreas', side: 'CUSTO' },

	{ code: '75', name: 'Outros custos e perdas operacionais', side: 'CUSTO' },
	{ code: '75.1', name: 'Sub-contratos', side: 'CUSTO' },
	{ code: '75.2', name: 'Fornecimentos e serviços de terceiros', side: 'CUSTO' },
	// A numeração salteada de 75.2.x (11-19 fornecimentos, 20-39 serviços) é a do
	// decreto. «Conservação e reparação» aparece de facto duas vezes na lista
	// original: 75.2.14 nos fornecimentos e 75.2.26 nos serviços.
	{ code: '75.2.11', name: 'Água', side: 'CUSTO' },
	{ code: '75.2.12', name: 'Electricidade', side: 'CUSTO' },
	{ code: '75.2.13', name: 'Combustíveis e outros fluídos', side: 'CUSTO' },
	{ code: '75.2.14', name: 'Conservação e reparação', side: 'CUSTO' },
	{ code: '75.2.15', name: 'Material de protecção, segurança e conforto', side: 'CUSTO' },
	{ code: '75.2.16', name: 'Ferramentas e utensílios de desgaste rápido', side: 'CUSTO' },
	{ code: '75.2.17', name: 'Material de escritório', side: 'CUSTO' },
	{ code: '75.2.18', name: 'Livros e documentação técnica', side: 'CUSTO' },
	{ code: '75.2.19', name: 'Outros fornecimentos', side: 'CUSTO' },
	{ code: '75.2.20', name: 'Comunicação', side: 'CUSTO' },
	{ code: '75.2.21', name: 'Rendas e alugueres', side: 'CUSTO' },
	{ code: '75.2.22', name: 'Seguros', side: 'CUSTO' },
	{ code: '75.2.23', name: 'Deslocações e estadas', side: 'CUSTO' },
	{ code: '75.2.24', name: 'Despesas de representação', side: 'CUSTO' },
	{ code: '75.2.26', name: 'Conservação e reparação (serviços)', side: 'CUSTO' },
	{ code: '75.2.27', name: 'Vigilância e segurança', side: 'CUSTO' },
	{ code: '75.2.28', name: 'Limpeza, higiene e conforto', side: 'CUSTO' },
	{ code: '75.2.29', name: 'Publicidade e propaganda', side: 'CUSTO' },
	{ code: '75.2.30', name: 'Contencioso e notariado', side: 'CUSTO' },
	{ code: '75.2.31', name: 'Comissões a intermediários', side: 'CUSTO' },
	{ code: '75.2.32', name: 'Assistência técnica', side: 'CUSTO' },
	{ code: '75.2.33', name: 'Trabalhos executados no exterior', side: 'CUSTO' },
	{ code: '75.2.34', name: 'Honorários e avenças', side: 'CUSTO' },
	{ code: '75.2.35', name: 'Royalties', side: 'CUSTO' },
	{ code: '75.2.39', name: 'Outros serviços', side: 'CUSTO' },
	{ code: '75.3', name: 'Impostos', side: 'CUSTO' },
	{ code: '75.4', name: 'Despesas confidenciais', side: 'CUSTO' },
	{ code: '75.5', name: 'Quotizações', side: 'CUSTO' },
	{ code: '75.6', name: 'Ofertas e amostras de existências', side: 'CUSTO' },
	{ code: '75.8', name: 'Outros custos e perdas operacionais', side: 'CUSTO' },

	{ code: '76', name: 'Custos e perdas financeiros gerais', side: 'CUSTO' },
	{ code: '76.1', name: 'Juros', side: 'CUSTO' },
	{ code: '76.2', name: 'Diferenças de câmbio desfavoráveis', side: 'CUSTO' },
	{ code: '76.3', name: 'Descontos de pronto pagamento concedidos', side: 'CUSTO' },
	{ code: '76.4', name: 'Amortizações de investimentos em imóveis', side: 'CUSTO' },
	{ code: '76.5', name: 'Provisões para aplicações financeiras', side: 'CUSTO' },
	{ code: '76.6', name: 'Perdas na alienação de aplicações financeiras', side: 'CUSTO' },
	{ code: '76.7', name: 'Serviços bancários', side: 'CUSTO' },

	{ code: '77', name: 'Custos e perdas financeiros em filiais e associadas', side: 'CUSTO' },

	{ code: '78', name: 'Outros custos e perdas não operacionais', side: 'CUSTO' },
	{ code: '78.1', name: 'Provisões do exercício', side: 'CUSTO' },
	{ code: '78.2', name: 'Amortizações extraordinárias', side: 'CUSTO' },
	{ code: '78.3', name: 'Perdas em imobilizações', side: 'CUSTO' },
	{ code: '78.4', name: 'Perdas em existências', side: 'CUSTO' },
	{ code: '78.5', name: 'Dívidas incobráveis', side: 'CUSTO' },
	{ code: '78.6', name: 'Multas e penalidades contratuais', side: 'CUSTO' },
	{ code: '78.7', name: 'Custos de reestruturação', side: 'CUSTO' },
	{ code: '78.8', name: 'Descontinuidade de operações', side: 'CUSTO' },
	{ code: '78.9', name: 'Alterações de políticas contabilísticas', side: 'CUSTO' },
	{ code: '78.10', name: 'Correcções relativas a exercícios anteriores', side: 'CUSTO' },
	{ code: '78.11', name: 'Outros custos e perdas não operacionais', side: 'CUSTO' },

	{ code: '79', name: 'Custos e perdas extraordinárias', side: 'CUSTO' },
	{ code: '79.1', name: 'Perdas resultantes de catástrofes naturais', side: 'CUSTO' },
	{ code: '79.2', name: 'Perdas resultantes de convulsões políticas', side: 'CUSTO' },
	{ code: '79.3', name: 'Perdas resultantes de expropriações', side: 'CUSTO' },
	{ code: '79.4', name: 'Perdas resultantes de sinistros', side: 'CUSTO' },

	// ─── CLASSE 8 — RESULTADOS ───────────────────────────────────────────────
	{ code: '81', name: 'Resultados transitados', side: 'CAPITAL_PROPRIO' },
	{ code: '82', name: 'Resultados operacionais', side: 'CAPITAL_PROPRIO' },
	{ code: '83', name: 'Resultados financeiros', side: 'CAPITAL_PROPRIO' },
	{ code: '84', name: 'Resultados em filiais e associadas', side: 'CAPITAL_PROPRIO' },
	{ code: '85', name: 'Resultados não operacionais', side: 'CAPITAL_PROPRIO' },
	{ code: '86', name: 'Resultados extraordinários', side: 'CAPITAL_PROPRIO' },
	{ code: '87', name: 'Imposto sobre os lucros', side: 'CAPITAL_PROPRIO' },
	{ code: '88', name: 'Resultado líquido do exercício', side: 'CAPITAL_PROPRIO' },
	{ code: '89', name: 'Dividendos antecipados', side: 'CAPITAL_PROPRIO' },
];

/** Classe (1 a 8) a que o código pertence — é sempre o seu primeiro dígito. */
export function accountClassOf(code: string): number {
	return Number(code[0]);
}

/** Código da conta-mãe: `34.5.3` → `34.5`, `34.5` → `34`, `34` → nenhuma. */
export function parentCodeOf(code: string): string | undefined {
	const lastDot = code.lastIndexOf('.');
	return lastDot === -1 ? undefined : code.slice(0, lastDot);
}

/**
 * Ordena códigos de conta pela hierarquia e não como texto, para que `75.2.9`
 * venha antes de `75.2.11` e `68.9` antes de `68.10`.
 */
export function compareAccountCodes(a: string, b: string): number {
	const left = a.split('.');
	const right = b.split('.');
	for (let i = 0; i < Math.max(left.length, right.length); i++) {
		const l = left[i];
		const r = right[i];
		if (l === undefined) return -1;
		if (r === undefined) return 1;
		const diff = Number(l) - Number(r);
		if (diff !== 0) return diff;
	}
	return 0;
}

/** Códigos-âncora usados pelos lançamentos automáticos — não devem ser apagados. */
export const ANCHOR_ACCOUNT_CODES = {
	CAIXA: '45.1',
	BANCOS: '43.1',
	CLIENTES: '31.1',
	IVA_LIQUIDADO: '34.5.3',
	VENDAS: '61.3',
	PRESTACOES_SERVICOS: '62.1',
} as const;
