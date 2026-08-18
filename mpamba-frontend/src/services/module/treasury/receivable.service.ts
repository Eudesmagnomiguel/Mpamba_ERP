import apiClient from '@/shared/utils/api.utils';
import { CreateReceivableDto } from '@/shared/dto/treasury.dto';
import { Receivable } from '@/shared/types/treasury.types';

export const receivableService = {
	async listReceivables(status?: string) {
		const response = await apiClient.get<{ data: Receivable[] }>('/treasury/receivables', { params: { status } });
		return response.data.data;
	},

	async createReceivable(data: CreateReceivableDto) {
		const response = await apiClient.post<{ data: Receivable }>('/treasury/receivables', data);
		return response.data.data;
	},

	async markAsPaid(id: string) {
		const response = await apiClient.post<{ data: Receivable }>(`/treasury/receivables/${id}/pay`);
		return response.data.data;
	},

	async deleteReceivable(id: string) {
		await apiClient.delete(`/treasury/receivables/${id}`);
	},
};
