import apiClient from '@/shared/utils/api.utils';
import { InvoiceSeries } from '@/shared/types/billing.types';

export const seriesService = {
	async listSeries() {
		const response = await apiClient.get<{ data: InvoiceSeries[] }>('/billing/series');
		return response.data.data;
	},

	async createSeries(data: any) {
		const response = await apiClient.post<{ data: InvoiceSeries }>('/billing/series', data);
		return response.data.data;
	},

	async updateSeries(id: string, data: any) {
		const response = await apiClient.patch<{ data: InvoiceSeries }>(`/billing/series/${id}`, data);
		return response.data.data;
	},

	async deleteSeries(id: string) {
		await apiClient.delete(`/billing/series/${id}`);
	},
};
