import apiClient from '@/shared/utils/api.utils';
import {
	CreateProductDto,
	StockProductListFiltersDto,
	UpdateProductDto,
} from '@/shared/dto/stock.dto';
import {
	Product,
	StockPaginatedResponse,
} from '@/shared/types/stock.types';

export const productService = {
	async listProducts(params?: StockProductListFiltersDto) {
		const response = await apiClient.get<StockPaginatedResponse<Product>>('/stock/products', { params });
		return response.data;
	},

	async getProductById(id: string) {
		const response = await apiClient.get<{ data: Product }>(`/stock/products/${id}`);
		return response.data.data;
	},

	async createProduct(data: CreateProductDto) {
		const response = await apiClient.post<{ data: Product }>('/stock/products', data);
		return response.data.data;
	},

	async updateProduct(id: string, data: UpdateProductDto) {
		const response = await apiClient.patch<{ data: Product }>(`/stock/products/${id}`, data);
		return response.data.data;
	},

	async deleteProduct(id: string) {
		await apiClient.delete(`/stock/products/${id}`);
	},
};
