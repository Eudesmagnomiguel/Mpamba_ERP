import apiClient from '@/shared/utils/api.utils';
import {
	StockMostUsedFiltersDto,
} from '@/shared/dto/stock.dto';
import {
	StockMostUsedProduct,
	StockSummary,
} from '@/shared/types/stock.types';

export const reportService = {
	async getSummary() {
		const response = await apiClient.get<{ data: StockSummary }>('/stock/summary');
		return response.data.data;
	},

	async getMostUsedProducts(params?: StockMostUsedFiltersDto) {
		const response = await apiClient.get<{ data: StockMostUsedProduct[] }>('/stock/insights/most-used', { params });
		return response.data.data;
	},

	/** Relatório de inventário em CSV. */
	async exportReport() {
		const response = await apiClient.get('/stock/report/export', { responseType: 'blob' });
		return response.data as Blob;
	},

	/** Relatório de inventário em Excel (.xlsx). */
	async exportReportExcel() {
		const response = await apiClient.get('/stock/report/export/excel', { responseType: 'blob' });
		return response.data as Blob;
	},
};
