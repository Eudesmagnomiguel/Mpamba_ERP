import apiClient from '@/shared/utils/api.utils';
import { CreateCostCenterDto, UpdateCostCenterDto } from '@/shared/dto/treasury.dto';
import { CostCenter } from '@/shared/types/treasury.types';

export const costCenterService = {
	async listCostCenters() {
		const response = await apiClient.get<{ data: CostCenter[] }>('/treasury/cost-centers');
		return response.data.data;
	},

	async getCostCenterById(id: string) {
		const response = await apiClient.get<{ data: CostCenter }>(`/treasury/cost-centers/${id}`);
		return response.data.data;
	},

	async createCostCenter(data: CreateCostCenterDto) {
		const response = await apiClient.post<{ data: CostCenter }>('/treasury/cost-centers', data);
		return response.data.data;
	},

	async updateCostCenter(id: string, data: UpdateCostCenterDto) {
		const response = await apiClient.patch<{ data: CostCenter }>(`/treasury/cost-centers/${id}`, data);
		return response.data.data;
	},

	async deleteCostCenter(id: string) {
		await apiClient.delete(`/treasury/cost-centers/${id}`);
	},
};
