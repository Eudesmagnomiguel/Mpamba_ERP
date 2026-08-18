import apiClient from '@/shared/utils/api.utils';
import { CreatePayableDto } from '@/shared/dto/treasury.dto';
import { Payable } from '@/shared/types/treasury.types';

export const payableService = {
	async listPayables(status?: string) {
		const response = await apiClient.get<{ data: Payable[] }>('/treasury/payables', { params: { status } });
		return response.data.data;
	},

	async createPayable(data: CreatePayableDto) {
		const response = await apiClient.post<{ data: Payable }>('/treasury/payables', data);
		return response.data.data;
	},

	async markAsPaid(id: string) {
		const response = await apiClient.post<{ data: Payable }>(`/treasury/payables/${id}/pay`);
		return response.data.data;
	},

	async deletePayable(id: string) {
		await apiClient.delete(`/treasury/payables/${id}`);
	},
};
