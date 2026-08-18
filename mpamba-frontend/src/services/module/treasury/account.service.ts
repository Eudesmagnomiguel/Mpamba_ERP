import apiClient from '@/shared/utils/api.utils';
import {
	AccountListFiltersDto,
	CreateFinancialAccountDto,
	UpdateFinancialAccountDto,
} from '@/shared/dto/treasury.dto';
import {
	FinancialAccount,
	TreasuryPaginatedResponse,
} from '@/shared/types/treasury.types';

export const accountService = {
	async listAccounts(params?: AccountListFiltersDto) {
		const response = await apiClient.get<TreasuryPaginatedResponse<FinancialAccount>>('/treasury/accounts', { params });
		return response.data;
	},

	async getAccountById(id: string) {
		const response = await apiClient.get<{ data: FinancialAccount }>(`/treasury/accounts/${id}`);
		return response.data.data;
	},

	async createAccount(data: CreateFinancialAccountDto) {
		const response = await apiClient.post<{ data: FinancialAccount }>('/treasury/accounts', data);
		return response.data.data;
	},

	async updateAccount(id: string, data: UpdateFinancialAccountDto) {
		const response = await apiClient.patch<{ data: FinancialAccount }>(`/treasury/accounts/${id}`, data);
		return response.data.data;
	},

	async deleteAccount(id: string) {
		await apiClient.delete(`/treasury/accounts/${id}`);
	},
};
