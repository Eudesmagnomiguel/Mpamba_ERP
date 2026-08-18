import apiClient from '@/shared/utils/api.utils';
import {
	Invoice,
	BillingPaginatedResponse,
} from '@/shared/types/billing.types';

export const proformaService = {
	async listProformas(params?: any) {
		const response = await apiClient.get<BillingPaginatedResponse<any>>('/billing/proformas', { params });
		return response.data;
	},

	async getProformaById(id: string) {
		const response = await apiClient.get<{ data: any }>(`/billing/proformas/${id}`);
		return response.data.data;
	},

	async createProforma(data: any) {
		const response = await apiClient.post<{ data: any }>('/billing/proformas', data);
		return response.data.data;
	},

	async updateProforma(id: string, data: any) {
		const response = await apiClient.patch<{ data: any }>(`/billing/proformas/${id}`, data);
		return response.data.data;
	},

	async convertProformaToInvoice(id: string, data?: any) {
		const response = await apiClient.post<{ data: Invoice }>(`/billing/proformas/${id}/convert`, data);
		return response.data.data;
	},

	async cancelProforma(id: string) {
		const response = await apiClient.post<{ data: any }>(`/billing/proformas/${id}/cancel`);
		return response.data.data;
	},
	
	async downloadProformaPDF(id: string) {
		const response = await apiClient.get(`/billing/proformas/${id}/pdf`, { responseType: 'blob' });
		return response.data;
	},
};
