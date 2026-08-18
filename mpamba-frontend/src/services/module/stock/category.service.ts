import apiClient from '@/shared/utils/api.utils';
import {
	CreateCategoryDto,
	StockCategoryListFiltersDto,
	UpdateCategoryDto,
} from '@/shared/dto/stock.dto';
import {
	Category,
	StockPaginatedResponse,
} from '@/shared/types/stock.types';

export const categoryService = {
	async listCategories(params?: StockCategoryListFiltersDto) {
		const response = await apiClient.get<StockPaginatedResponse<Category>>('/stock/categories', { params });
		return response.data;
	},

	async getCategoryById(id: string) {
		const response = await apiClient.get<{ data: Category }>(`/stock/categories/${id}`);
		return response.data.data;
	},

	async createCategory(data: CreateCategoryDto) {
		const response = await apiClient.post<{ data: Category }>('/stock/categories', data);
		return response.data.data;
	},

	async updateCategory(id: string, data: UpdateCategoryDto) {
		const response = await apiClient.patch<{ data: Category }>(`/stock/categories/${id}`, data);
		return response.data.data;
	},

	async deleteCategory(id: string) {
		await apiClient.delete(`/stock/categories/${id}`);
	},
};
