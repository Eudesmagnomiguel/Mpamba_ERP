import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { invoiceService } from '../../../services/module/billing/invoice.service.js';
import { receiptService } from '../../../services/module/billing/receipt.service.js';
import { proformaService } from '../../../services/module/billing/proforma.service.js';
import { creditNoteService } from '../../../services/module/billing/credit-note.service.js';
import { catalogService } from '../../../services/module/billing/service.service.js';
import {
	buildWorkbook,
	fileDateSuffix,
	sendWorkbook,
	type ExcelColumn,
} from '../../../services/module/excel.service.js';
import { getReportOrganizationName } from '../../../shared/utils/report.utils.js';
import { toFriendlyErrorMessage } from '../../../shared/utils/db-error.utils.js';

/**
 * Exportação das listagens de faturação para Excel.
 *
 * Cada endpoint respeita os mesmos filtros (`search`, `status`, …) da listagem
 * correspondente, mas devolve o conjunto completo — não só a página visível.
 */

function readFilter(req: AuthRequest, key: string): string | undefined {
	const value = req.query[key];
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

/** Título da folha com o nome da organização quando existe. */
function heading(base: string, organizationName?: string): string {
	return organizationName ? `${base} — ${organizationName}` : base;
}

export class BillingExportController {
	/** GET /billing/invoices/export */
	async exportInvoices(req: AuthRequest, res: Response) {
		try {
			const [rows, organizationName] = await Promise.all([
				invoiceService.listInvoicesForExport({
					search: readFilter(req, 'search'),
					status: readFilter(req, 'status'),
				}),
				getReportOrganizationName(),
			]);

			type Row = (typeof rows)[number];
			const columns: ExcelColumn<Row>[] = [
				{ header: 'Nº', value: (r) => r.number ?? '(rascunho)', width: 22 },
				{ header: 'Data', value: (r) => r.date, type: 'date', width: 14 },
				{ header: 'Vencimento', value: (r) => r.dueDate, type: 'date', width: 14 },
				{ header: 'Cliente', value: (r) => r.customerName, width: 34 },
				{ header: 'NIF', value: (r) => r.customerNif ?? '', width: 18 },
				{ header: 'Estado', value: (r) => r.status, width: 14 },
				{ header: 'Estado Pagamento', value: (r) => r.paymentStatus, width: 18 },
				{ header: 'Subtotal', value: (r) => r.subtotal, type: 'currency', width: 18 },
				{ header: 'Desconto', value: (r) => r.discountTotal, type: 'currency', width: 18 },
				{ header: 'Imposto', value: (r) => r.taxTotal, type: 'currency', width: 18 },
				{ header: 'Total', value: (r) => r.total, type: 'currency', width: 18 },
				{ header: 'Valor Pago', value: (r) => r.amountPaid, type: 'currency', width: 18 },
				{ header: 'Moeda', value: (r) => r.currency, width: 10 },
			];

			const buffer = await buildWorkbook(
				[
					{
						name: 'Faturas',
						title: heading('Faturas', organizationName),
						subtitle: `${rows.length} documento(s) · gerado a ${new Date().toLocaleDateString('pt-AO')}`,
						columns,
						rows,
						emptyMessage: 'Sem faturas para os filtros selecionados.',
						totals: [
							{
								label: 'TOTAL',
								values: {
									10: rows.reduce((sum, r) => sum + r.total, 0),
									11: rows.reduce((sum, r) => sum + r.amountPaid, 0),
								},
							},
						],
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `faturas-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Billing] Falha ao exportar faturas:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao exportar as faturas') });
		}
	}

	/** GET /billing/receipts/export */
	async exportReceipts(req: AuthRequest, res: Response) {
		try {
			const [rows, organizationName] = await Promise.all([
				receiptService.listReceipts({
					search: readFilter(req, 'search'),
					invoiceId: readFilter(req, 'invoiceId'),
				}),
				getReportOrganizationName(),
			]);

			type Row = (typeof rows)[number];
			const columns: ExcelColumn<Row>[] = [
				{ header: 'Nº', value: (r) => r.number ?? '(rascunho)', width: 22 },
				{ header: 'Data', value: (r) => r.date, type: 'date', width: 14 },
				{ header: 'Fatura', value: (r) => r.invoice?.number ?? '', width: 22 },
				{ header: 'Cliente', value: (r) => r.invoice?.customerName ?? '', width: 34 },
				{ header: 'Valor', value: (r) => r.amount, type: 'currency', width: 18 },
				{ header: 'Método de Pagamento', value: (r) => r.paymentMethod ?? '', width: 22 },
				{ header: 'Referência', value: (r) => r.reference ?? '', width: 22 },
				{ header: 'Estado', value: (r) => r.status, width: 14 },
			];

			const buffer = await buildWorkbook(
				[
					{
						name: 'Recibos',
						title: heading('Recibos', organizationName),
						subtitle: `${rows.length} documento(s) · gerado a ${new Date().toLocaleDateString('pt-AO')}`,
						columns,
						rows,
						emptyMessage: 'Sem recibos para os filtros selecionados.',
						totals: [{ label: 'TOTAL', values: { 4: rows.reduce((sum, r) => sum + r.amount, 0) } }],
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `recibos-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Billing] Falha ao exportar recibos:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao exportar os recibos') });
		}
	}

	/** GET /billing/proformas/export */
	async exportProformas(req: AuthRequest, res: Response) {
		try {
			const [rows, organizationName] = await Promise.all([
				proformaService.listProformas({
					search: readFilter(req, 'search'),
					status: readFilter(req, 'status'),
				}),
				getReportOrganizationName(),
			]);

			type Row = (typeof rows)[number];
			const columns: ExcelColumn<Row>[] = [
				{ header: 'Nº', value: (r) => r.number ?? '(rascunho)', width: 22 },
				{ header: 'Data', value: (r) => r.date, type: 'date', width: 14 },
				{ header: 'Validade', value: (r) => r.expiryDate, type: 'date', width: 14 },
				{ header: 'Cliente', value: (r) => r.customerName, width: 34 },
				{ header: 'NIF', value: (r) => r.customerNif ?? '', width: 18 },
				{ header: 'Estado', value: (r) => r.status, width: 14 },
				{ header: 'Subtotal', value: (r) => r.subtotal, type: 'currency', width: 18 },
				{ header: 'Desconto', value: (r) => r.discountTotal, type: 'currency', width: 18 },
				{ header: 'Imposto', value: (r) => r.taxTotal, type: 'currency', width: 18 },
				{ header: 'Total', value: (r) => r.total, type: 'currency', width: 18 },
				{ header: 'Moeda', value: (r) => r.currency, width: 10 },
			];

			const buffer = await buildWorkbook(
				[
					{
						name: 'Proformas',
						title: heading('Proformas', organizationName),
						subtitle: `${rows.length} documento(s) · gerado a ${new Date().toLocaleDateString('pt-AO')}`,
						columns,
						rows,
						emptyMessage: 'Sem proformas para os filtros selecionados.',
						totals: [{ label: 'TOTAL', values: { 9: rows.reduce((sum, r) => sum + r.total, 0) } }],
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `proformas-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Billing] Falha ao exportar proformas:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao exportar as proformas') });
		}
	}

	/** GET /billing/credit-notes/export */
	async exportCreditNotes(req: AuthRequest, res: Response) {
		try {
			const [rows, organizationName] = await Promise.all([
				creditNoteService.listCreditNotes({
					search: readFilter(req, 'search'),
					invoiceId: readFilter(req, 'invoiceId'),
				}),
				getReportOrganizationName(),
			]);

			type Row = (typeof rows)[number];
			const columns: ExcelColumn<Row>[] = [
				{ header: 'Nº', value: (r) => r.number ?? '(rascunho)', width: 22 },
				{ header: 'Data', value: (r) => r.date, type: 'date', width: 14 },
				{ header: 'Fatura', value: (r) => r.invoice?.number ?? '', width: 22 },
				{ header: 'Cliente', value: (r) => r.invoice?.customerName ?? '', width: 34 },
				{ header: 'Tipo', value: (r) => r.creditType, width: 16 },
				{ header: 'Valor', value: (r) => r.amount, type: 'currency', width: 18 },
				{ header: 'Motivo', value: (r) => r.reason ?? '', width: 40 },
				{ header: 'Estado', value: (r) => r.status, width: 14 },
			];

			const buffer = await buildWorkbook(
				[
					{
						name: 'Notas de Crédito',
						title: heading('Notas de Crédito', organizationName),
						subtitle: `${rows.length} documento(s) · gerado a ${new Date().toLocaleDateString('pt-AO')}`,
						columns,
						rows,
						emptyMessage: 'Sem notas de crédito para os filtros selecionados.',
						totals: [{ label: 'TOTAL', values: { 5: rows.reduce((sum, r) => sum + r.amount, 0) } }],
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `notas-de-credito-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Billing] Falha ao exportar notas de crédito:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao exportar as notas de crédito') });
		}
	}

	/** GET /billing/services/export */
	async exportServices(req: AuthRequest, res: Response) {
		try {
			const [rows, organizationName] = await Promise.all([
				catalogService.listServices({ search: readFilter(req, 'search') }),
				getReportOrganizationName(),
			]);

			type Row = (typeof rows)[number];
			const columns: ExcelColumn<Row>[] = [
				{ header: 'Nome', value: (r) => r.name, width: 36 },
				{ header: 'Categoria', value: (r) => r.category ?? '', width: 22 },
				{ header: 'Descrição', value: (r) => r.description ?? '', width: 44 },
				{ header: 'Preço', value: (r) => r.price, type: 'currency', width: 18 },
				{ header: 'Taxa de IVA (%)', value: (r) => r.taxRate, type: 'number', width: 16 },
				{ header: 'Estado', value: (r) => (r.isActive ? 'Ativo' : 'Inativo'), width: 12 },
			];

			const buffer = await buildWorkbook(
				[
					{
						name: 'Serviços',
						title: heading('Serviços', organizationName),
						subtitle: `${rows.length} serviço(s) · gerado a ${new Date().toLocaleDateString('pt-AO')}`,
						columns,
						rows,
						emptyMessage: 'Sem serviços registados.',
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `servicos-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Billing] Falha ao exportar serviços:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao exportar os serviços') });
		}
	}
}

export const billingExportController = new BillingExportController();
