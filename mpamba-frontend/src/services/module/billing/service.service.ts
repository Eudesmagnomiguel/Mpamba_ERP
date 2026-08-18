import apiClient from '@/shared/utils/api.utils';
import { CreateServiceDto, UpdateServiceDto } from '@/shared/dto/billing.dto';

export const catalogService = {
	async listServices(params?: any) {
		const response = await apiClient.get<{ data: any[] }>('/billing/services', { params });
		return response.data;
	},

	async getServiceById(id: string) {
		const response = await apiClient.get<{ data: any }>(`/billing/services/${id}`);
		return response.data.data;
	},

	async createService(data: CreateServiceDto) {
		const response = await apiClient.post<{ data: any }>('/billing/services', data);
		return response.data.data;
	},

	async updateService(id: string, data: UpdateServiceDto) {
		const response = await apiClient.patch<{ data: any }>(`/billing/services/${id}`, data);
		return response.data.data;
	},

	async deleteService(id: string) {
		await apiClient.delete(`/billing/services/${id}`);
	},
};
