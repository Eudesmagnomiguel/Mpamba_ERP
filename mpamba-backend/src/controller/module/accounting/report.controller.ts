import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { accountingReportService } from '../../../services/module/accounting/report.service.js';
import {
	buildWorkbook,
	fileDateSuffix,
	formatPeriod,
	sendWorkbook,
	type ExcelColumn,
} from '../../../services/module/excel.service.js';
import { getReportOrganizationName, parseDate, parseDateRange } from '../../../shared/utils/report.utils.js';
import { toFriendlyErrorMessage } from '../../../shared/utils/db-error.utils.js';

export class AccountingReportController {
	async trialBalance(req: AuthRequest, res: Response) {
		try {
			const { startDate, endDate } = req.query;
			const result = await accountingReportService.getTrialBalance({
				startDate: startDate ? new Date(startDate as string) : undefined,
				endDate: endDate ? new Date(endDate as string) : undefined,
			});
			res.json({ data: result });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async ledger(req: AuthRequest, res: Response) {
		try {
			const { startDate, endDate } = req.query;
			const result = await accountingReportService.getLedgerByAccount(req.params.accountId as string, {
				startDate: startDate ? new Date(startDate as string) : undefined,
				endDate: endDate ? new Date(endDate as string) : undefined,
			});
			res.json({ data: result });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async incomeStatement(req: AuthRequest, res: Response) {
		try {
			const { startDate, endDate } = req.query;
			const result = await accountingReportService.getIncomeStatement({
				startDate: startDate ? new Date(startDate as string) : undefined,
				endDate: endDate ? new Date(endDate as string) : undefined,
			});
			res.json({ data: result });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async balanceSheet(req: AuthRequest, res: Response) {
		try {
			const { asOfDate } = req.query;
			const result = await accountingReportService.getBalanceSheet({
				asOfDate: asOfDate ? new Date(asOfDate as string) : new Date(),
			});
			res.json({ data: result });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	// ─── Exportação Excel ───────────────────────────────────────────────────

	/** Balancete em .xlsx — GET /accounting/reports/trial-balance/export */
	async trialBalanceExcel(req: AuthRequest, res: Response) {
		try {
			const range = parseDateRange(req.query as Record<string, unknown>);
			const [result, organizationName] = await Promise.all([
				accountingReportService.getTrialBalance(range),
				getReportOrganizationName(),
			]);

			type Row = (typeof result.rows)[number];
			const columns: ExcelColumn<Row>[] = [
				{ header: 'Código', value: (r) => r.code, width: 14 },
				{ header: 'Conta', value: (r) => r.name, width: 42 },
				{ header: 'Classe', value: (r) => r.class ?? '', width: 16 },
				{ header: 'Débito', value: (r) => r.debit, type: 'currency', width: 18 },
				{ header: 'Crédito', value: (r) => r.credit, type: 'currency', width: 18 },
				{ header: 'Saldo', value: (r) => r.balance, type: 'currency', width: 18 },
			];

			const buffer = await buildWorkbook(
				[
					{
						name: 'Balancete',
						title: `Balancete${organizationName ? ` — ${organizationName}` : ''}`,
						subtitle: formatPeriod(range.startDate, range.endDate),
						columns,
						rows: result.rows,
						totals: [
							{
								label: 'TOTAL',
								values: { 3: result.totals.debit, 4: result.totals.credit },
							},
							{
								label: result.totals.balanced
									? 'Balancete equilibrado'
									: 'ATENÇÃO: débito e crédito não coincidem',
								values: {},
							},
						],
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `balancete-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Accounting] Falha ao exportar balancete:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao exportar o balancete') });
		}
	}

	/** Extrato de conta em .xlsx — GET /accounting/reports/ledger/:accountId/export */
	async ledgerExcel(req: AuthRequest, res: Response) {
		try {
			const range = parseDateRange(req.query as Record<string, unknown>);
			const result = await accountingReportService.getLedgerByAccount(
				req.params.accountId as string,
				range
			);
			const organizationName = await getReportOrganizationName();

			type Row = (typeof result.rows)[number];
			const columns: ExcelColumn<Row>[] = [
				{ header: 'Data', value: (r) => r.date, type: 'date', width: 14 },
				{ header: 'Nº Lançamento', value: (r) => r.number ?? '', width: 18 },
				{ header: 'Descrição', value: (r) => r.description ?? '', width: 46 },
				{ header: 'Referência', value: (r) => r.sourceReference ?? '', width: 22 },
				{ header: 'Débito', value: (r) => r.debit, type: 'currency', width: 18 },
				{ header: 'Crédito', value: (r) => r.credit, type: 'currency', width: 18 },
				{ header: 'Saldo', value: (r) => r.balance, type: 'currency', width: 18 },
			];

			const accountLabel = `${result.account.code} — ${result.account.name}`;
			const buffer = await buildWorkbook(
				[
					{
						name: `Extrato ${result.account.code}`,
						title: `Extrato de Conta: ${accountLabel}`,
						subtitle: `${organizationName ? `${organizationName} · ` : ''}${formatPeriod(range.startDate, range.endDate)}`,
						columns,
						rows: result.rows,
						emptyMessage: 'Sem lançamentos nesta conta para o período selecionado.',
						totals: [{ label: 'SALDO FINAL', values: { 6: result.closingBalance } }],
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `extrato-${result.account.code}-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Accounting] Falha ao exportar extrato:', error);
			res.status(400).json({ message: toFriendlyErrorMessage(error, 'Erro ao exportar o extrato de conta') });
		}
	}

	/** Demonstração de Resultados em .xlsx — GET /accounting/reports/income-statement/export */
	async incomeStatementExcel(req: AuthRequest, res: Response) {
		try {
			const range = parseDateRange(req.query as Record<string, unknown>);
			const [result, organizationName] = await Promise.all([
				accountingReportService.getIncomeStatement(range),
				getReportOrganizationName(),
			]);

			// Proveitos e Custos partilham a mesma forma; juntam-se numa folha com
			// uma coluna de natureza para que o utilizador possa filtrar no Excel.
			type Row = { nature: string; code: string; name: string; amount: number };
			const rows: Row[] = [
				...result.revenues.map((r) => ({ nature: 'Proveito', code: r.code, name: r.name, amount: r.amount })),
				...result.costs.map((r) => ({ nature: 'Custo', code: r.code, name: r.name, amount: r.amount })),
			];

			const columns: ExcelColumn<Row>[] = [
				{ header: 'Natureza', value: (r) => r.nature, width: 14 },
				{ header: 'Código', value: (r) => r.code, width: 14 },
				{ header: 'Conta', value: (r) => r.name, width: 46 },
				{ header: 'Valor', value: (r) => r.amount, type: 'currency', width: 20 },
			];

			const buffer = await buildWorkbook(
				[
					{
						name: 'Demonstração Resultados',
						title: `Demonstração de Resultados${organizationName ? ` — ${organizationName}` : ''}`,
						subtitle: formatPeriod(range.startDate, range.endDate),
						columns,
						rows,
						totals: [
							{ label: 'TOTAL PROVEITOS', values: { 3: result.totals.revenues } },
							{ label: 'TOTAL CUSTOS', values: { 3: result.totals.costs } },
							{ label: 'RESULTADO LÍQUIDO', values: { 3: result.totals.netResult } },
						],
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `demonstracao-resultados-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Accounting] Falha ao exportar demonstração de resultados:', error);
			res.status(500).json({
				message: toFriendlyErrorMessage(error, 'Erro ao exportar a demonstração de resultados'),
			});
		}
	}

	/** Balanço em .xlsx — GET /accounting/reports/balance-sheet/export */
	async balanceSheetExcel(req: AuthRequest, res: Response) {
		try {
			const asOfDate = parseDate((req.query as Record<string, unknown>).asOfDate) ?? new Date();
			const [result, organizationName] = await Promise.all([
				accountingReportService.getBalanceSheet({ asOfDate }),
				getReportOrganizationName(),
			]);

			type Row = { section: string; code: string; name: string; balance: number };
			const rows: Row[] = [
				...result.assets.map((r) => ({ section: 'Ativo', code: r.code, name: r.name, balance: r.balance })),
				...result.liabilities.map((r) => ({ section: 'Passivo', code: r.code, name: r.name, balance: r.balance })),
				...result.equity.map((r) => ({ section: 'Capital Próprio', code: r.code, name: r.name, balance: r.balance })),
			];

			const columns: ExcelColumn<Row>[] = [
				{ header: 'Rubrica', value: (r) => r.section, width: 18 },
				{ header: 'Código', value: (r) => r.code, width: 14 },
				{ header: 'Conta', value: (r) => r.name, width: 46 },
				{ header: 'Saldo', value: (r) => r.balance, type: 'currency', width: 20 },
			];

			const buffer = await buildWorkbook(
				[
					{
						name: 'Balanço',
						title: `Balanço${organizationName ? ` — ${organizationName}` : ''}`,
						subtitle: `Posição a ${asOfDate.toLocaleDateString('pt-AO')}`,
						columns,
						rows,
						totals: [
							{ label: 'TOTAL DO ATIVO', values: { 3: result.totals.assets } },
							{ label: 'TOTAL DO PASSIVO E CAPITAL PRÓPRIO', values: { 3: result.totals.liabilitiesAndEquity } },
							{
								label: result.totals.balanced
									? 'Balanço equilibrado'
									: 'ATENÇÃO: o Ativo não fecha com Passivo + Capital Próprio',
								values: {},
							},
						],
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `balanco-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Accounting] Falha ao exportar balanço:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao exportar o balanço') });
		}
	}
}

export const accountingReportController = new AccountingReportController();
