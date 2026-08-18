export type AccountSide = 'ATIVO' | 'PASSIVO' | 'CAPITAL_PROPRIO' | 'CUSTO' | 'PROVEITO';

export interface DefaultAccountTemplate {
	code: string;
	name: string;
	class: number;
	side: AccountSide;
	parentCode?: string;
}

/**
 * Plano de contas por defeito, inspirado no PGC-Angola (classes 1-8).
 * Semeado automaticamente (lazy) na primeira vez que uma organização acede à Contabilidade.
 *
 * `side` classifica cada conta para a Demonstração de Resultados e o Balanço —
 * a classe 2 "Terceiros" mistura Ativo (Clientes) com Passivo (Fornecedores, IVA
 * Liquidado), por isso a classificação é explícita por conta em vez de inferida
 * apenas pela classe.
 */
export const DEFAULT_ACCOUNTS: DefaultAccountTemplate[] = [
	{ code: '1', name: 'Meios Monetários', class: 1, side: 'ATIVO' },
	{ code: '11', name: 'Caixa', class: 1, side: 'ATIVO', parentCode: '1' },
	{ code: '12', name: 'Depósitos à Ordem (Bancos)', class: 1, side: 'ATIVO', parentCode: '1' },

	{ code: '2', name: 'Terceiros', class: 2, side: 'ATIVO' },
	{ code: '21', name: 'Clientes', class: 2, side: 'ATIVO', parentCode: '2' },
	{ code: '22', name: 'Fornecedores', class: 2, side: 'PASSIVO', parentCode: '2' },
	{ code: '24', name: 'Estado e Outros Entes Públicos', class: 2, side: 'PASSIVO', parentCode: '2' },
	{ code: '2432', name: 'IVA Liquidado', class: 2, side: 'PASSIVO', parentCode: '24' },
	{ code: '2433', name: 'IVA Dedutível', class: 2, side: 'ATIVO', parentCode: '24' },

	{ code: '3', name: 'Existências', class: 3, side: 'ATIVO' },
	{ code: '32', name: 'Mercadorias', class: 3, side: 'ATIVO', parentCode: '3' },

	{ code: '4', name: 'Imobilizações', class: 4, side: 'ATIVO' },
	{ code: '42', name: 'Imobilizações Corpóreas', class: 4, side: 'ATIVO', parentCode: '4' },

	{ code: '5', name: 'Capital, Reservas e Resultados', class: 5, side: 'CAPITAL_PROPRIO' },
	{ code: '51', name: 'Capital', class: 5, side: 'CAPITAL_PROPRIO', parentCode: '5' },
	{ code: '59', name: 'Resultados Transitados', class: 5, side: 'CAPITAL_PROPRIO', parentCode: '5' },

	{ code: '6', name: 'Custos e Perdas', class: 6, side: 'CUSTO' },
	{ code: '61', name: 'Custo das Mercadorias Vendidas', class: 6, side: 'CUSTO', parentCode: '6' },
	{ code: '62', name: 'Fornecimentos e Serviços de Terceiros', class: 6, side: 'CUSTO', parentCode: '6' },
	{ code: '63', name: 'Custos com Pessoal', class: 6, side: 'CUSTO', parentCode: '6' },
	{ code: '68', name: 'Custos Financeiros', class: 6, side: 'CUSTO', parentCode: '6' },

	{ code: '7', name: 'Proveitos e Ganhos', class: 7, side: 'PROVEITO' },
	{ code: '71', name: 'Vendas', class: 7, side: 'PROVEITO', parentCode: '7' },
	{ code: '72', name: 'Prestações de Serviços', class: 7, side: 'PROVEITO', parentCode: '7' },
	{ code: '78', name: 'Proveitos Financeiros', class: 7, side: 'PROVEITO', parentCode: '7' },

	{ code: '8', name: 'Resultados', class: 8, side: 'CAPITAL_PROPRIO' },
	{ code: '88', name: 'Resultado Líquido do Exercício', class: 8, side: 'CAPITAL_PROPRIO', parentCode: '8' },
];

/** Códigos-âncora usados pelos lançamentos automáticos — não devem ser apagados. */
export const ANCHOR_ACCOUNT_CODES = {
	CAIXA: '11',
	BANCOS: '12',
	CLIENTES: '21',
	IVA_LIQUIDADO: '2432',
	VENDAS: '71',
} as const;
