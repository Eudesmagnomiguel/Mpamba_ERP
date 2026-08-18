import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import {
	buildWorkbook,
	fileDateSuffix,
	formatPeriod,
	sendWorkbook,
	type ExcelColumn,
} from '../../src/services/module/excel.service.js';

interface Row {
	name: string;
	quantity: number;
	price: number;
	date: Date;
}

const COLUMNS: ExcelColumn<Row>[] = [
	{ header: 'Produto', value: (r) => r.name },
	{ header: 'Quantidade', value: (r) => r.quantity, type: 'integer' },
	{ header: 'Preço', value: (r) => r.price, type: 'currency' },
	{ header: 'Data', value: (r) => r.date, type: 'date' },
];

const ROWS: Row[] = [
	{ name: 'Cimento', quantity: 12, price: 4500.5, date: new Date('2026-03-15T00:00:00Z') },
	{ name: 'Areia', quantity: 3, price: 1200, date: new Date('2026-04-02T00:00:00Z') },
];

/** Reabre os bytes gerados para inspecionar o resultado real, não o input. */
async function reopen(buffer: Buffer): Promise<ExcelJS.Workbook> {
	const workbook = new ExcelJS.Workbook();
	// `as any`: os tipos do exceljs pedem ArrayBuffer, mas aceitam Buffer.
	await workbook.xlsx.load(buffer as any);
	return workbook;
}

describe('excel.service', () => {
	describe('buildWorkbook', () => {
		it('escreve título, subtítulo, cabeçalho e linhas de dados', async () => {
			const buffer = await buildWorkbook([
				{
					name: 'Inventário',
					title: 'Relatório de Inventário',
					subtitle: 'Período: 01/03/2026 a 30/04/2026',
					columns: COLUMNS,
					rows: ROWS,
				},
			]);

			const sheet = (await reopen(buffer)).getWorksheet('Inventário');
			expect(sheet).toBeDefined();
			expect(sheet!.getCell('A1').value).toBe('Relatório de Inventário');
			expect(sheet!.getCell('A2').value).toBe('Período: 01/03/2026 a 30/04/2026');
			// Linha 3 fica em branco; o cabeçalho da tabela é a linha 4.
			expect(sheet!.getRow(4).values).toEqual([undefined, 'Produto', 'Quantidade', 'Preço', 'Data']);
			expect(sheet!.getCell('A5').value).toBe('Cimento');
			expect(sheet!.getCell('B5').value).toBe(12);
		});

		it('guarda números como números e datas como datas, não como texto', async () => {
			const buffer = await buildWorkbook([{ name: 'Dados', columns: COLUMNS, rows: ROWS }]);
			const sheet = (await reopen(buffer)).getWorksheet('Dados')!;

			// Sem título/subtítulo o cabeçalho é a linha 1 e os dados começam na 2.
			expect(sheet.getCell('C2').value).toBe(4500.5);
			expect(typeof sheet.getCell('C2').value).toBe('number');
			expect(sheet.getCell('D2').value).toBeInstanceOf(Date);
		});

		it('aplica o formato numérico declarado em cada coluna', async () => {
			const buffer = await buildWorkbook([{ name: 'Dados', columns: COLUMNS, rows: ROWS }]);
			const sheet = (await reopen(buffer)).getWorksheet('Dados')!;

			expect(sheet.getCell('B2').numFmt).toBe('#,##0');
			expect(sheet.getCell('C2').numFmt).toBe('#,##0.00 "Kz"');
			expect(sheet.getCell('D2').numFmt).toBe('dd/mm/yyyy');
			expect(sheet.getCell('A2').numFmt).toBeUndefined();
		});

		it('escreve linhas de totais nas colunas indicadas, a negrito', async () => {
			const buffer = await buildWorkbook([
				{
					name: 'Dados',
					columns: COLUMNS,
					rows: ROWS,
					totals: [{ label: 'TOTAL', values: { 2: 5700.5 } }],
				},
			]);
			const sheet = (await reopen(buffer)).getWorksheet('Dados')!;

			// 1 cabeçalho + 2 linhas de dados = a linha 4 é a dos totais.
			expect(sheet.getCell('A4').value).toBe('TOTAL');
			expect(sheet.getCell('C4').value).toBe(5700.5);
			expect(sheet.getCell('C4').font?.bold).toBe(true);
			expect(sheet.getCell('C4').numFmt).toBe('#,##0.00 "Kz"');
		});

		it('ignora índices de totais fora do alcance das colunas', async () => {
			const buffer = await buildWorkbook([
				{
					name: 'Dados',
					columns: COLUMNS,
					rows: ROWS,
					totals: [{ label: 'TOTAL', values: { 99: 1, [-1]: 2 } }],
				},
			]);
			const sheet = (await reopen(buffer)).getWorksheet('Dados')!;

			expect(sheet.getCell('A4').value).toBe('TOTAL');
			expect(sheet.getRow(4).cellCount).toBeLessThanOrEqual(COLUMNS.length);
		});

		it('mostra uma mensagem em vez de uma tabela vazia quando não há linhas', async () => {
			const buffer = await buildWorkbook([
				{ name: 'Dados', columns: COLUMNS, rows: [], emptyMessage: 'Sem produtos registados.' },
			]);
			const sheet = (await reopen(buffer)).getWorksheet('Dados')!;

			expect(sheet.getCell('A2').value).toBe('Sem produtos registados.');
		});

		it('congela o cabeçalho e liga o filtro automático', async () => {
			const buffer = await buildWorkbook([
				{ name: 'Dados', title: 'T', columns: COLUMNS, rows: ROWS },
			]);
			const sheet = (await reopen(buffer)).getWorksheet('Dados')!;

			// Título na linha 1, branco na 2, cabeçalho na 3.
			expect(sheet.views[0]?.state).toBe('frozen');
			expect((sheet.views[0] as any)?.ySplit).toBe(3);
			expect(sheet.autoFilter).toBeTruthy();
		});

		it('substitui caracteres proibidos e trunca nomes de separador a 31 caracteres', async () => {
			const buffer = await buildWorkbook([
				{ name: 'Extrato 11/1: Caixa [principal]', columns: COLUMNS, rows: ROWS },
				{ name: 'a'.repeat(50), columns: COLUMNS, rows: ROWS },
			]);
			const workbook = await reopen(buffer);

			const names = workbook.worksheets.map((s) => s.name);
			expect(names[0]).toBe('Extrato 11-1- Caixa -principal-');
			expect(names[0]!.length).toBeLessThanOrEqual(31);
			expect(names[1]).toBe('a'.repeat(31));
		});

		it('cria uma folha por especificação', async () => {
			const buffer = await buildWorkbook([
				{ name: 'Resumo', columns: COLUMNS, rows: ROWS },
				{ name: 'Contas', columns: COLUMNS, rows: [] },
				{ name: 'Evolução', columns: COLUMNS, rows: ROWS },
			]);
			const workbook = await reopen(buffer);

			expect(workbook.worksheets.map((s) => s.name)).toEqual(['Resumo', 'Contas', 'Evolução']);
		});

		it('rejeita um livro sem folhas', async () => {
			await expect(buildWorkbook([])).rejects.toThrow(/pelo menos uma folha/);
		});

		it('grava o nome da organização nas propriedades do ficheiro', async () => {
			const buffer = await buildWorkbook([{ name: 'Dados', columns: COLUMNS, rows: ROWS }], {
				organizationName: 'Construções Luanda, Lda',
			});

			expect((await reopen(buffer)).creator).toBe('Construções Luanda, Lda');
		});
	});

	describe('sendWorkbook', () => {
		function fakeResponse() {
			const headers: Record<string, string> = {};
			return {
				headers,
				body: null as Buffer | null,
				setHeader(name: string, value: string) {
					headers[name] = value;
				},
				end(payload: Buffer) {
					this.body = payload;
				},
			};
		}

		it('responde com o content-type do xlsx e o ficheiro como anexo', () => {
			const res = fakeResponse();
			const buffer = Buffer.from('conteudo-falso');

			sendWorkbook(res as any, buffer, 'balancete-2026-08-08');

			expect(res.headers['Content-Type']).toBe(
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			);
			expect(res.headers['Content-Disposition']).toBe(
				'attachment; filename="balancete-2026-08-08.xlsx"'
			);
			expect(res.headers['Content-Length']).toBe(String(buffer.length));
			expect(res.body).toBe(buffer);
		});

		it('limpa caracteres que quebrariam o header Content-Disposition', () => {
			const res = fakeResponse();

			sendWorkbook(res as any, Buffer.from('x'), 'extrato "11/1"; rm -rf');

			expect(res.headers['Content-Disposition']).toBe('attachment; filename="extrato-11-1-rm-rf.xlsx"');
		});

		it('recorre a um nome por omissão quando nada resta após a limpeza', () => {
			const res = fakeResponse();

			sendWorkbook(res as any, Buffer.from('x'), '///');

			expect(res.headers['Content-Disposition']).toBe('attachment; filename="relatorio.xlsx"');
		});
	});

	describe('formatPeriod', () => {
		const start = new Date('2026-03-01T00:00:00Z');
		const end = new Date('2026-04-30T00:00:00Z');

		it('descreve um intervalo completo', () => {
			expect(formatPeriod(start, end)).toContain('a');
			expect(formatPeriod(start, end)).toMatch(/^Período: /);
		});

		it('descreve intervalos abertos e a ausência de intervalo', () => {
			expect(formatPeriod(start, undefined)).toMatch(/^Desde /);
			expect(formatPeriod(undefined, end)).toMatch(/^Até /);
			expect(formatPeriod()).toBe('Período: todo o histórico');
		});
	});

	describe('fileDateSuffix', () => {
		it('formata a data como AAAA-MM-DD', () => {
			expect(fileDateSuffix(new Date('2026-08-08T13:45:00Z'))).toBe('2026-08-08');
		});
	});
});
