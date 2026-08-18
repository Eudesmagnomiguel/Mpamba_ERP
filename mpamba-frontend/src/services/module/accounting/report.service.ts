import apiClient from '@/shared/utils/api.utils';
import { AccountLedger, BalanceSheet, IncomeStatement, TrialBalance } from '@/shared/types/accounting.types';

export interface AccountingReportFilters {
	startDate?: string;
	endDate?: string;
}

export interface BalanceSheetFilters {
	asOfDate?: string;
}

export const accountingReportService = {
	async getTrialBalance(params?: AccountingReportFilters) {
		const response = await apiClient.get<{ data: TrialBalance }>('/accounting/reports/trial-balance', { params });
		return response.data.data;
	},

	async getLedger(accountId: string, params?: AccountingReportFilters) {
		const response = await apiClient.get<{ data: AccountLedger }>(`/accounting/reports/ledger/${accountId}`, { params });
		return response.data.data;
	},

	async getIncomeStatement(params?: AccountingReportFilters) {
		const response = await apiClient.get<{ data: IncomeStatement }>('/accounting/reports/income-statement', { params });
		return response.data.data;
	},

	async getBalanceSheet(params?: BalanceSheetFilters) {
		const response = await apiClient.get<{ data: BalanceSheet }>('/accounting/reports/balance-sheet', { params });
		return response.data.data;
	},

	// ── Exportação Excel (.xlsx) ────────────────────────────────────────────
	// Mesmos filtros dos relatórios acima; o ficheiro chega como Blob.

	async exportTrialBalance(params?: AccountingReportFilters) {
		const response = await apiClient.get('/accounting/reports/trial-balance/export', {
			params,
			responseType: 'blob',
		});
		return response.data as Blob;
	},

	async exportLedger(accountId: string, params?: AccountingReportFilters) {
		const response = await apiClient.get(`/accounting/reports/ledger/${accountId}/export`, {
			params,
			responseType: 'blob',
		});
		return response.data as Blob;
	},

	async exportIncomeStatement(params?: AccountingReportFilters) {
		const response = await apiClient.get('/accounting/reports/income-statement/export', {
			params,
			responseType: 'blob',
		});
		return response.data as Blob;
	},

	async exportBalanceSheet(params?: BalanceSheetFilters) {
		const response = await apiClient.get('/accounting/reports/balance-sheet/export', {
			params,
			responseType: 'blob',
		});
		return response.data as Blob;
	},
};
