import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { reportService } from '../../../services/module/treasury/report.service.js';
import { toFriendlyErrorMessage } from '../../../shared/utils/db-error.utils.js';
import {
	buildWorkbook,
	fileDateSuffix,
	formatPeriod,
	sendWorkbook,
	type ExcelColumn,
	type ExcelSheetSpec,
} from '../../../services/module/excel.service.js';
import { getReportOrganizationName, parseDate, parseDateRange } from '../../../shared/utils/report.utils.js';

export class ReportController {
	async getCashFlowReport(req: AuthRequest, res: Response) {
		try {
			const { startDate, endDate } = req.query;
			if (!startDate || !endDate) {
				return res.status(400).json({ message: 'Intervalo de datas é obrigatório' });
			}
			const result = await reportService.getCashFlowReport(
				new Date(startDate as string),
				new Date(endDate as string)
			);
			res.json({ data: result });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getCategoryReport(req: AuthRequest, res: Response) {
		try {
			const { type, startDate, endDate } = req.query;
			if (!type || !startDate || !endDate) {
				return res.status(400).json({ message: 'Tipo e intervalo de datas são obrigatórios' });
			}
			const result = await reportService.getCategoryReport(
				type as 'ENTRADA' | 'SAIDA',
				new Date(startDate as string),
				new Date(endDate as string)
			);
			res.json({ data: result });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getSummary(req: AuthRequest, res: Response) {
		try {
			const { startDate, endDate } = req.query;
			const result = await reportService.getSummary({
				startDate: startDate as string | undefined,
				endDate: endDate as string | undefined,
			});
			res.json({ data: result });
		} catch (error: any) {
			console.error('[Treasury] Falha ao carregar resumo:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao carregar os dados da tesouraria') });
		}
	}

	// ─── Exportação Excel ───────────────────────────────────────────────────

	/** Fluxo de caixa em .xlsx — GET /treasury/reports/cash-flow/export */
	async exportCashFlowReport(req: AuthRequest, res: Response) {
		try {
			const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
			if (!startDate || !endDate) {
				return res.status(400).json({ message: 'Intervalo de datas é obrigatório' });
			}

			const [result, organizationName] = await Promise.all([
				reportService.getCashFlowReport(startDate, endDate),
				getReportOrganizationName(),
			]);

			// O fluxo de caixa é um agregado, não uma lista: uma linha só, com uma
			// coluna por indicador, para que cada um leve o seu próprio formato
			// (o nº de transações é inteiro, os restantes são moeda).
			type Row = typeof result;
			const columns: ExcelColumn<Row>[] = [
				{ header: 'Entradas', value: (r) => r.income, type: 'currency', width: 20 },
				{ header: 'Saídas', value: (r) => r.expense, type: 'currency', width: 20 },
				{ header: 'Fluxo Líquido', value: (r) => r.netFlow, type: 'currency', width: 20 },
				{ header: 'Nº de Transações', value: (r) => r.transactionCount, type: 'integer', width: 20 },
			];

			const buffer = await buildWorkbook(
				[
					{
						name: 'Fluxo de Caixa',
						title: `Fluxo de Caixa${organizationName ? ` — ${organizationName}` : ''}`,
						subtitle: formatPeriod(startDate, endDate),
						columns,
						rows: [result],
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `fluxo-de-caixa-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Treasury] Falha ao exportar fluxo de caixa:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao exportar o fluxo de caixa') });
		}
	}

	/** Relatório por categoria em .xlsx — GET /treasury/reports/category/export */
	async exportCategoryReport(req: AuthRequest, res: Response) {
		try {
			const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
			const type = req.query.type;
			if (type !== 'ENTRADA' && type !== 'SAIDA') {
				return res.status(400).json({ message: 'Tipo deve ser ENTRADA ou SAIDA' });
			}
			if (!startDate || !endDate) {
				return res.status(400).json({ message: 'Intervalo de datas é obrigatório' });
			}

			const [result, organizationName] = await Promise.all([
				reportService.getCategoryReport(type, startDate, endDate),
				getReportOrganizationName(),
			]);

			type Row = (typeof result)[number];
			const columns: ExcelColumn<Row>[] = [
				{ header: 'Categoria', value: (r) => r.category ?? 'Sem Categoria', width: 34 },
				{ header: 'Total', value: (r) => r.total, type: 'currency', width: 22 },
				{ header: 'Nº de Movimentos', value: (r) => r.count, type: 'integer', width: 20 },
			];

			const label = type === 'ENTRADA' ? 'Entradas' : 'Saídas';
			const buffer = await buildWorkbook(
				[
					{
						name: `Categorias — ${label}`,
						title: `${label} por Categoria${organizationName ? ` — ${organizationName}` : ''}`,
						subtitle: formatPeriod(startDate, endDate),
						columns,
						rows: result,
						totals: [
							{
								label: 'TOTAL',
								values: {
									1: result.reduce((sum, r) => sum + r.total, 0),
									2: result.reduce((sum, r) => sum + r.count, 0),
								},
							},
						],
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `categorias-${type.toLowerCase()}-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Treasury] Falha ao exportar relatório por categoria:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao exportar o relatório por categoria') });
		}
	}

	/**
	 * Resumo da tesouraria em .xlsx — GET /treasury/reports/summary/export
	 *
	 * O resumo alimenta um dashboard com três blocos distintos, por isso sai
	 * como três folhas em vez de uma tabela única achatada.
	 */
	async exportSummary(req: AuthRequest, res: Response) {
		try {
			const startDate = parseDate((req.query as Record<string, unknown>).startDate);
			const endDate = parseDate((req.query as Record<string, unknown>).endDate);

			const [result, organizationName] = await Promise.all([
				reportService.getSummary({
					startDate: startDate?.toISOString(),
					endDate: endDate?.toISOString(),
				}),
				getReportOrganizationName(),
			]);

			const heading = organizationName ? ` — ${organizationName}` : '';
			const period = formatPeriod(startDate, endDate);

			type Kpi = { indicator: string; value: number };
			const kpis: ExcelSheetSpec<Kpi> = {
				name: 'Resumo',
				title: `Resumo de Tesouraria${heading}`,
				subtitle: period,
				columns: [
					{ header: 'Indicador', value: (r) => r.indicator, width: 28 },
					{ header: 'Valor', value: (r) => r.value, type: 'currency', width: 22 },
				],
				rows: [
					{ indicator: 'Saldo Total', value: result.totalBalance },
					{ indicator: 'Receitas do Período', value: result.totalIncomes },
					{ indicator: 'Despesas do Período', value: result.totalExpenses },
				],
			};

			type AccountRow = (typeof result.accountsBalance)[number];
			const accounts: ExcelSheetSpec<AccountRow> = {
				name: 'Contas',
				title: `Saldos por Conta${heading}`,
				columns: [
					{ header: 'Conta', value: (r) => r.name, width: 34 },
					{ header: 'Tipo', value: (r) => r.type, width: 18 },
					{ header: 'Moeda', value: (r) => r.currency, width: 12 },
					{ header: 'Saldo', value: (r) => r.balance, type: 'currency', width: 22 },
				],
				rows: result.accountsBalance,
				emptyMessage: 'Sem contas financeiras ativas.',
			};

			type EvolutionRow = (typeof result.evolutionData)[number];
			const evolution: ExcelSheetSpec<EvolutionRow> = {
				name: 'Evolução',
				title: `Evolução dos Últimos 6 Meses${heading}`,
				columns: [
					{ header: 'Mês', value: (r) => r.date, width: 16 },
					{ header: 'Receitas', value: (r) => r.incomes, type: 'currency', width: 20 },
					{ header: 'Despesas', value: (r) => r.expenses, type: 'currency', width: 20 },
				],
				rows: result.evolutionData,
				emptyMessage: 'Sem movimentos nos últimos 6 meses.',
			};

			const buffer = await buildWorkbook([kpis, accounts, evolution], { organizationName });
			sendWorkbook(res, buffer, `resumo-tesouraria-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Treasury] Falha ao exportar resumo:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao exportar o resumo de tesouraria') });
		}
	}
}

export const reportController = new ReportController();
