import apiClient from '@/shared/utils/api.utils';
import { BillingPaginatedResponse } from '@/shared/types/billing.types';

export const receiptService = {
	async listReceipts(params?: any) {
		const response = await apiClient.get<BillingPaginatedResponse<any>>('/billing/receipts', { params });
		return response.data;
	},

	async getReceiptById(id: string) {
		const response = await apiClient.get<{ data: any }>(`/billing/receipts/${id}`);
		return response.data.data;
	},

	async createReceipt(data: any) {
		const response = await apiClient.post<{ data: any }>('/billing/receipts', data);
		return response.data.data;
	},

	async issueReceipt(id: string) {
		const response = await apiClient.post<{ data: any }>(`/billing/receipts/${id}/issue`);
		return response.data.data;
	},

	async cancelReceipt(id: string) {
		const response = await apiClient.post<{ data: any }>(`/billing/receipts/${id}/cancel`);
		return response.data.data;
	},

	async downloadReceiptPDF(id: string, format: 'A4' | 'THERMAL' = 'A4') {
		const response = await apiClient.get(`/billing/receipts/${id}/pdf`, { responseType: 'blob', params: { format } });
		return response.data;
	},
};
