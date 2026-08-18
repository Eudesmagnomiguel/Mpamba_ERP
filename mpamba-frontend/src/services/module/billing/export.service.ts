import apiClient from '@/shared/utils/api.utils';

/**
 * Exportação das listagens de faturação para Excel (.xlsx).
 *
 * Cada método aceita os mesmos filtros da listagem correspondente e devolve o
 * conjunto completo de registos — não apenas a página visível no ecrã.
 */

export interface BillingExportFilters {
	search?: string;
	status?: string;
	invoiceId?: string;
}

async function downloadXlsx(path: string, params?: BillingExportFilters): Promise<Blob> {
	const response = await apiClient.get(path, { params, responseType: 'blob' });
	return response.data as Blob;
}

export const billingExportService = {
	exportInvoices: (params?: Pick<BillingExportFilters, 'search' | 'status'>) =>
		downloadXlsx('/billing/invoices/export', params),

	exportReceipts: (params?: Pick<BillingExportFilters, 'search' | 'invoiceId'>) =>
		downloadXlsx('/billing/receipts/export', params),

	exportProformas: (params?: Pick<BillingExportFilters, 'search' | 'status'>) =>
		downloadXlsx('/billing/proformas/export', params),

	exportCreditNotes: (params?: Pick<BillingExportFilters, 'search' | 'invoiceId'>) =>
		downloadXlsx('/billing/credit-notes/export', params),

	exportServices: (params?: Pick<BillingExportFilters, 'search'>) =>
		downloadXlsx('/billing/services/export', params),
};

export default billingExportService;
