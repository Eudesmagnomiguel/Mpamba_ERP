import apiClient from '@/shared/utils/api.utils';
import {
	CreateCustomerDto,
	UpdateCustomerDto,
} from '@/shared/dto/billing.dto';
import {
	Customer,
} from '@/shared/types/billing.types';

export const customerService = {
	async listCustomers(params?: any) {
		const response = await apiClient.get<{ data: Customer[] }>('/billing/customers', { params });
		return response.data;
	},

	async getCustomerById(id: string) {
		const response = await apiClient.get<{ data: Customer }>(`/billing/customers/${id}`);
		return response.data.data;
	},

	async createCustomer(data: CreateCustomerDto) {
		const response = await apiClient.post<{ data: Customer }>('/billing/customers', data);
		return response.data.data;
	},

	async updateCustomer(id: string, data: UpdateCustomerDto) {
		const response = await apiClient.patch<{ data: Customer }>(`/billing/customers/${id}`, data);
		return response.data.data;
	},

	async deleteCustomer(id: string) {
		await apiClient.delete(`/billing/customers/${id}`);
	},
};
