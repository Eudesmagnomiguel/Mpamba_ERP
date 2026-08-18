import apiClient from '@/shared/utils/api.utils';
import { BillingPaginatedResponse } from '@/shared/types/billing.types';

export const creditNoteService = {
	async listCreditNotes(params?: any) {
		const response = await apiClient.get<BillingPaginatedResponse<any>>('/billing/credit-notes', { params });
		return response.data;
	},

	async getCreditNoteById(id: string) {
		const response = await apiClient.get<{ data: any }>(`/billing/credit-notes/${id}`);
		return response.data.data;
	},

	async createCreditNote(data: any) {
		const response = await apiClient.post<{ data: any }>('/billing/credit-notes', data);
		return response.data.data;
	},

	async issueCreditNote(id: string) {
		const response = await apiClient.post<{ data: any }>(`/billing/credit-notes/${id}/issue`);
		return response.data.data;
	},

	async cancelCreditNote(id: string) {
		const response = await apiClient.post<{ data: any }>(`/billing/credit-notes/${id}/cancel`);
		return response.data.data;
	},

	async downloadCreditNotePDF(id: string) {
		const response = await apiClient.get(`/billing/credit-notes/${id}/pdf`, { responseType: 'blob' });
		return response.data;
	},
};
