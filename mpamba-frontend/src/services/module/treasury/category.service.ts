import apiClient from '@/shared/utils/api.utils';
import {
	CategoryListFiltersDto,
	CreateFinancialCategoryDto,
	UpdateFinancialCategoryDto,
} from '@/shared/dto/treasury.dto';
import {
	FinancialCategory,
	TreasuryPaginatedResponse,
} from '@/shared/types/treasury.types';

export const categoryService = {
	async listCategories(params?: CategoryListFiltersDto) {
		const response = await apiClient.get<TreasuryPaginatedResponse<FinancialCategory>>('/treasury/categories', { params });
		return response.data;
	},

	async getCategoryById(id: string) {
		const response = await apiClient.get<{ data: FinancialCategory }>(`/treasury/categories/${id}`);
		return response.data.data;
	},

	async createCategory(data: CreateFinancialCategoryDto) {
		const response = await apiClient.post<{ data: FinancialCategory }>('/treasury/categories', data);
		return response.data.data;
	},

	async updateCategory(id: string, data: UpdateFinancialCategoryDto) {
		const response = await apiClient.patch<{ data: FinancialCategory }>(`/treasury/categories/${id}`, data);
		return response.data.data;
	},

	async deleteCategory(id: string) {
		await apiClient.delete(`/treasury/categories/${id}`);
	},
};
