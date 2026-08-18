import ExcelJS from 'exceljs';
import type { Response } from 'express';

/**
 * Geração de folhas de cálculo .xlsx para os relatórios da aplicação.
 *
 * Os relatórios continuam a ser produzidos pelos serviços de cada módulo; este
 * ficheiro só sabe transformar `{ colunas, linhas, totais }` num livro Excel
 * formatado. Assim um relatório novo só precisa de declarar as suas colunas.
 */

// ─── Tipos ──────────────────────────────────────────────────────────────────

/** Determina o formato numérico aplicado à célula no Excel. */
export type ExcelCellType = 'text' | 'integer' | 'number' | 'currency' | 'date';

export interface ExcelColumn<T> {
	header: string;
	/** Extrai o valor bruto da linha. Devolver `Date`/`number` — não texto
	 *  pré-formatado — para que o Excel saiba ordenar e somar. */
	value: (row: T) => string | number | Date | null | undefined;
	type?: ExcelCellType;
	width?: number;
}

/** Linha de fecho (Total, Subtotal, Resultado…) escrita a negrito no fim. */
export interface ExcelTotalsRow {
	label: string;
	/** Valores indexados pela posição 0-based da coluna a que pertencem. */
	values: Record<number, string | number>;
}

export interface ExcelSheetSpec<T> {
	/** Nome do separador. Caracteres proibidos pelo Excel são substituídos. */
	name: string;
	title?: string;
	subtitle?: string;
	columns: ExcelColumn<T>[];
	rows: T[];
	totals?: ExcelTotalsRow[];
	/** Mensagem mostrada quando `rows` vem vazio. */
	emptyMessage?: string;
}

// ─── Constantes de formatação ───────────────────────────────────────────────

const NUMBER_FORMATS: Record<ExcelCellType, string | undefined> = {
	text: undefined,
	integer: '#,##0',
	number: '#,##0.00',
	currency: '#,##0.00 "Kz"',
	date: 'dd/mm/yyyy',
};

const HEADER_FILL: ExcelJS.Fill = {
	type: 'pattern',
	pattern: 'solid',
	fgColor: { argb: 'FF1E293B' }, // slate-800, alinhado com a UI
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
	top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
	left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
	bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
	right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
};

/** O Excel rejeita : \ / ? * [ ] em nomes de separador e limita a 31 caracteres. */
function sanitizeSheetName(name: string): string {
	const cleaned = name.replace(/[:\\/?*[\]]/g, '-').trim();
	return (cleaned.length > 0 ? cleaned : 'Relatório').slice(0, 31);
}

// ─── Construção do livro ────────────────────────────────────────────────────

function writeSheet<T>(workbook: ExcelJS.Workbook, spec: ExcelSheetSpec<T>): void {
	const sheet = workbook.addWorksheet(sanitizeSheetName(spec.name));
	const columnCount = spec.columns.length;
	if (columnCount === 0) return;

	sheet.columns = spec.columns.map((column) => ({
		width: column.width ?? Math.max(12, Math.min(40, column.header.length + 4)),
	}));

	// ── Cabeçalho do documento ──────────────────────────────────────────────
	if (spec.title) {
		const row = sheet.addRow([spec.title]);
		sheet.mergeCells(row.number, 1, row.number, columnCount);
		row.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF0F172A' } };
		row.height = 22;
	}

	if (spec.subtitle) {
		const row = sheet.addRow([spec.subtitle]);
		sheet.mergeCells(row.number, 1, row.number, columnCount);
		row.getCell(1).font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
	}

	if (spec.title || spec.subtitle) sheet.addRow([]);

	// ── Cabeçalho da tabela ─────────────────────────────────────────────────
	const headerRow = sheet.addRow(spec.columns.map((column) => column.header));
	headerRow.eachCell((cell) => {
		cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
		cell.fill = HEADER_FILL;
		cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
		cell.border = THIN_BORDER;
	});
	headerRow.height = 20;

	// Congela tudo acima da primeira linha de dados e liga o filtro automático.
	sheet.views = [{ state: 'frozen', ySplit: headerRow.number }];
	sheet.autoFilter = {
		from: { row: headerRow.number, column: 1 },
		to: { row: headerRow.number, column: columnCount },
	};

	// ── Linhas de dados ─────────────────────────────────────────────────────
	if (spec.rows.length === 0) {
		const row = sheet.addRow([spec.emptyMessage ?? 'Sem dados para o período selecionado.']);
		sheet.mergeCells(row.number, 1, row.number, columnCount);
		row.getCell(1).font = { italic: true, color: { argb: 'FF94A3B8' } };
		return;
	}

	for (const item of spec.rows) {
		const row = sheet.addRow(spec.columns.map((column) => column.value(item) ?? ''));
		spec.columns.forEach((column, index) => {
			const cell = row.getCell(index + 1);
			const format = NUMBER_FORMATS[column.type ?? 'text'];
			if (format) cell.numFmt = format;
			cell.border = THIN_BORDER;
		});
	}

	// ── Linhas de totais ────────────────────────────────────────────────────
	for (const totals of spec.totals ?? []) {
		const cells: (string | number)[] = new Array(columnCount).fill('');
		cells[0] = totals.label;
		for (const [index, value] of Object.entries(totals.values)) {
			const position = Number(index);
			if (position >= 0 && position < columnCount) cells[position] = value;
		}

		const row = sheet.addRow(cells);
		spec.columns.forEach((column, index) => {
			const cell = row.getCell(index + 1);
			const format = NUMBER_FORMATS[column.type ?? 'text'];
			if (format) cell.numFmt = format;
			cell.font = { bold: true };
			cell.border = {
				...THIN_BORDER,
				top: { style: 'medium', color: { argb: 'FF1E293B' } },
			};
		});
	}
}

export interface WorkbookMeta {
	/** Nome da organização, gravado nas propriedades do ficheiro. */
	organizationName?: string;
	/** Momento de geração. Injetado por quem chama para manter isto testável. */
	generatedAt?: Date;
}

/**
 * Monta um livro com uma folha por especificação e devolve os bytes .xlsx.
 * Aceita folhas de tipos de linha diferentes — daí o `ExcelSheetSpec<any>[]`.
 */
export async function buildWorkbook(
	sheets: ExcelSheetSpec<any>[],
	meta?: WorkbookMeta
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = meta?.organizationName ?? 'Mpamba';
	workbook.created = meta?.generatedAt ?? new Date();

	if (sheets.length === 0) {
		throw new Error('Um relatório Excel precisa de pelo menos uma folha');
	}

	for (const spec of sheets) writeSheet(workbook, spec);

	const buffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(buffer);
}

const XLSX_CONTENT_TYPE =
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Escreve o livro na resposta como download.
 *
 * `filename` deve vir sem extensão; caracteres inválidos em nomes de ficheiro
 * são removidos para não corromper o header `Content-Disposition`.
 */
export function sendWorkbook(res: Response, buffer: Buffer, filename: string): void {
	const safeName =
		filename
			.replace(/[^\w.\-]+/g, '-')
			.replace(/-{2,}/g, '-')
			.replace(/^-+|-+$/g, '') || 'relatorio';
	res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
	res.setHeader('Content-Disposition', `attachment; filename="${safeName}.xlsx"`);
	res.setHeader('Content-Length', String(buffer.length));
	res.end(buffer);
}

/** Sufixo de data usado nos nomes dos ficheiros: `relatorio-stock-2026-08-08`. */
export function fileDateSuffix(date: Date = new Date()): string {
	return date.toISOString().slice(0, 10);
}

/** Formata um intervalo para o subtítulo da folha. */
export function formatPeriod(startDate?: Date, endDate?: Date): string {
	const format = (date: Date) => date.toLocaleDateString('pt-AO');
	if (startDate && endDate) return `Período: ${format(startDate)} a ${format(endDate)}`;
	if (startDate) return `Desde ${format(startDate)}`;
	if (endDate) return `Até ${format(endDate)}`;
	return 'Período: todo o histórico';
}
