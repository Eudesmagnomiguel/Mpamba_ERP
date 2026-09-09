import { describe, it, expect } from 'vitest';
import {
	DEFAULT_ACCOUNTS,
	ANCHOR_ACCOUNT_CODES,
	accountClassOf,
	parentCodeOf,
	compareAccountCodes,
} from '../../../src/services/module/accounting/default-accounts.constants.js';
import { ACCOUNT_CODE_PATTERN } from '../../../src/shared/dto/accounting.dto.js';

describe('Plano de contas do PGC-Angola (Decreto n.º 82/01)', () => {
	const codes = DEFAULT_ACCOUNTS.map((account) => account.code);
	const codeSet = new Set(codes);

	it('não tem códigos repetidos', () => {
		expect(codeSet.size).toBe(codes.length);
	});

	it('usa a numeração do PGC em todos os códigos', () => {
		const invalid = codes.filter((code) => !ACCOUNT_CODE_PATTERN.test(code));
		expect(invalid).toEqual([]);
	});

	it('não cria contas de 1 dígito — são títulos de classe, não contas', () => {
		expect(codes.filter((code) => code.length === 1)).toEqual([]);
	});

	it('tem a conta-mãe de cada sub-conta', () => {
		const orphans = codes.filter((code) => {
			const parent = parentCodeOf(code);
			return !!parent && !codeSet.has(parent);
		});
		expect(orphans).toEqual([]);
	});

	it('declara cada conta-mãe antes das suas sub-contas, para a semear primeiro', () => {
		const seen = new Set<string>();
		const outOfOrder: string[] = [];
		for (const code of codes) {
			const parent = parentCodeOf(code);
			if (parent && !seen.has(parent)) outOfOrder.push(code);
			seen.add(code);
		}
		expect(outOfOrder).toEqual([]);
	});

	it('cobre as oito classes da contabilidade geral', () => {
		const classes = new Set(codes.map(accountClassOf));
		expect([...classes].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	it('classifica as trocas de classe do decreto face ao plano anterior', () => {
		const byCode = new Map(DEFAULT_ACCOUNTS.map((account) => [account.code, account]));
		// 4 Meios monetarios (era classe 1), 3 Terceiros (era 2), 2 Existencias (era 3)
		expect(byCode.get('45')?.name).toBe('Caixa');
		expect(byCode.get('43')?.name).toBe('Depósitos à ordem');
		expect(byCode.get('31')?.name).toBe('Clientes');
		expect(byCode.get('26')?.name).toBe('Mercadorias');
		// 6 Proveitos (era 7) e 7 Custos (era 6)
		expect(byCode.get('61')?.side).toBe('PROVEITO');
		expect(byCode.get('71')?.side).toBe('CUSTO');
	});

	it('trata as contas de terceiros que não são todas do mesmo lado', () => {
		const byCode = new Map(DEFAULT_ACCOUNTS.map((account) => [account.code, account]));
		expect(byCode.get('31.1')?.side).toBe('ATIVO');
		expect(byCode.get('31.9')?.side).toBe('PASSIVO');
		expect(byCode.get('32.1')?.side).toBe('PASSIVO');
		expect(byCode.get('32.9')?.side).toBe('ATIVO');
		expect(byCode.get('34.5.2')?.side).toBe('ATIVO');
		expect(byCode.get('34.5.3')?.side).toBe('PASSIVO');
	});

	it('inclui todas as contas-âncora dos lançamentos automáticos', () => {
		for (const code of Object.values(ANCHOR_ACCOUNT_CODES)) {
			expect(codeSet.has(code)).toBe(true);
		}
	});

	it('usa contas-âncora desagregadas, que não agregam sub-contas', () => {
		const parents = new Set(codes.map(parentCodeOf).filter(Boolean));
		for (const code of Object.values(ANCHOR_ACCOUNT_CODES)) {
			expect(parents.has(code)).toBe(false);
		}
	});
});

describe('accountClassOf', () => {
	it('devolve o primeiro dígito do código', () => {
		expect(accountClassOf('11')).toBe(1);
		expect(accountClassOf('34.5.3')).toBe(3);
		expect(accountClassOf('75.2.39')).toBe(7);
	});
});

describe('parentCodeOf', () => {
	it('remove o último segmento do código', () => {
		expect(parentCodeOf('34.5.3')).toBe('34.5');
		expect(parentCodeOf('34.5')).toBe('34');
	});

	it('não devolve mãe para uma conta de 2 dígitos', () => {
		expect(parentCodeOf('34')).toBeUndefined();
	});
});

describe('compareAccountCodes', () => {
	it('ordena por segmento numérico e não como texto', () => {
		expect(['68.10', '68.9', '68.1'].sort(compareAccountCodes)).toEqual(['68.1', '68.9', '68.10']);
		expect(['75.2.11', '75.2.9'].sort(compareAccountCodes)).toEqual(['75.2.9', '75.2.11']);
	});

	it('coloca a conta-mãe antes das suas sub-contas', () => {
		expect(['34.5.3', '34', '34.5'].sort(compareAccountCodes)).toEqual(['34', '34.5', '34.5.3']);
	});

	it('ordena as classes por ordem crescente', () => {
		expect(['71', '11', '45.1', '31.1'].sort(compareAccountCodes)).toEqual(['11', '31.1', '45.1', '71']);
	});
});
