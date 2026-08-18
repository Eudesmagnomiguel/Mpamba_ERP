import apiClient from '@/shared/utils/api.utils';
import { CreateTaxRuleDto, UpdateTaxRuleDto } from '@/shared/dto/billing.dto';
import { TaxRule } from '@/shared/types/billing.types';

export const taxService = {
	async listTaxRules() {
		const response = await apiClient.get<{ data: TaxRule[] }>('/billing/tax-rules');
		return response.data.data;
	},

	async createTaxRule(data: CreateTaxRuleDto) {
		const response = await apiClient.post<{ data: TaxRule }>('/billing/tax-rules', data);
		return response.data.data;
	},

	async updateTaxRule(id: string, data: UpdateTaxRuleDto) {
		const response = await apiClient.patch<{ data: TaxRule }>(`/billing/tax-rules/${id}`, data);
		return response.data.data;
	},

	async deleteTaxRule(id: string) {
		await apiClient.delete(`/billing/tax-rules/${id}`);
	},
};
