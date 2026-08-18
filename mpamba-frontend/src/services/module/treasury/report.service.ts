import apiClient from '@/shared/utils/api.utils';
import { TreasurySummary } from '@/shared/types/treasury.types';

export const reportService = {
	async getSummary(params?: { startDate?: string; endDate?: string }) {
		const response = await apiClient.get<{ data: TreasurySummary }>('/treasury/reports/summary', { params });
		return response.data.data;
	},

	async exportMovements(params?: { startDate?: string; endDate?: string; accountId?: string; type?: string }) {
		const response = await apiClient.get('/treasury/reports/export', {
			params,
			responseType: 'blob',
		});
		return response.data;
	},

	// ── Exportação Excel (.xlsx) ────────────────────────────────────────────

	/** Resumo da tesouraria: KPIs, saldos por conta e evolução, em três folhas. */
	async exportSummary(params?: { startDate?: string; endDate?: string }) {
		const response = await apiClient.get('/treasury/reports/summary/export', {
			params,
			responseType: 'blob',
		});
		return response.data as Blob;
	},

	async exportCashFlow(params: { startDate: string; endDate: string }) {
		const response = await apiClient.get('/treasury/reports/cash-flow/export', {
			params,
			responseType: 'blob',
		});
		return response.data as Blob;
	},

	async exportCategoryReport(params: { type: 'ENTRADA' | 'SAIDA'; startDate: string; endDate: string }) {
		const response = await apiClient.get('/treasury/reports/category/export', {
			params,
			responseType: 'blob',
		});
		return response.data as Blob;
	},
};
