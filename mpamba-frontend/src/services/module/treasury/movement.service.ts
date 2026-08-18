import apiClient from '@/shared/utils/api.utils';
import {
	CreateMovementDto,
	CreateTransferDto,
	MovementListFiltersDto,
} from '@/shared/dto/treasury.dto';
import {
	FinancialMovement,
	TreasuryPaginatedResponse,
} from '@/shared/types/treasury.types';

export const movementService = {
	async listMovements(params?: MovementListFiltersDto) {
		const response = await apiClient.get<TreasuryPaginatedResponse<FinancialMovement>>('/treasury/movements', { params });
		return response.data;
	},

	async getMovementById(id: string) {
		const response = await apiClient.get<{ data: FinancialMovement }>(`/treasury/movements/${id}`);
		return response.data.data;
	},

	async createMovement(data: CreateMovementDto) {
		const response = await apiClient.post<{ data: FinancialMovement }>('/treasury/movements', data);
		return response.data.data;
	},

	async createTransfer(data: CreateTransferDto) {
		const response = await apiClient.post<{ data: FinancialMovement[] }>('/treasury/movements/transfer', data);
		return response.data.data;
	},

	async deleteMovement(id: string) {
		await apiClient.delete(`/treasury/movements/${id}`);
	},
};
