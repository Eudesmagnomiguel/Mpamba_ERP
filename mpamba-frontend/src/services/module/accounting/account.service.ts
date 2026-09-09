import apiClient from '@/shared/utils/api.utils';
import { CreateAccountingAccountDto, UpdateAccountingAccountDto } from '@/shared/dto/accounting.dto';
import { AccountingAccount, PgcReference } from '@/shared/types/accounting.types';

export const accountingAccountService = {
	async listAccounts() {
		const response = await apiClient.get<{ data: AccountingAccount[] }>('/accounting/accounts');
		return response.data.data;
	},

	/** Lista oficial do PGC (Decreto n.º 82/01), para consulta. */
	async getPgcReference() {
		const response = await apiClient.get<{ data: PgcReference }>('/accounting/accounts/pgc');
		return response.data.data;
	},

	async getAccountById(id: string) {
		const response = await apiClient.get<{ data: AccountingAccount }>(`/accounting/accounts/${id}`);
		return response.data.data;
	},

	async createAccount(data: CreateAccountingAccountDto) {
		const response = await apiClient.post<{ data: AccountingAccount }>('/accounting/accounts', data);
		return response.data.data;
	},

	async updateAccount(id: string, data: UpdateAccountingAccountDto) {
		const response = await apiClient.patch<{ data: AccountingAccount }>(`/accounting/accounts/${id}`, data);
		return response.data.data;
	},

	async deleteAccount(id: string) {
		await apiClient.delete(`/accounting/accounts/${id}`);
	},
};
