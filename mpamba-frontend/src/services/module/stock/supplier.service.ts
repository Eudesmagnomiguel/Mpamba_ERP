import apiClient from '@/shared/utils/api.utils';
import {
	CreateSupplierDto,
	StockSupplierListFiltersDto,
	UpdateSupplierDto,
} from '@/shared/dto/stock.dto';
import {
	Supplier,
	StockPaginatedResponse,
} from '@/shared/types/stock.types';

export const supplierService = {
	async listSuppliers(params?: StockSupplierListFiltersDto) {
		const response = await apiClient.get<StockPaginatedResponse<Supplier>>('/stock/suppliers', { params });
		return response.data;
	},

	async getSupplierById(id: string) {
		const response = await apiClient.get<{ data: Supplier }>(`/stock/suppliers/${id}`);
		return response.data.data;
	},

	async createSupplier(data: CreateSupplierDto) {
		const response = await apiClient.post<{ data: Supplier }>('/stock/suppliers', data);
		return response.data.data;
	},

	async updateSupplier(id: string, data: UpdateSupplierDto) {
		const response = await apiClient.patch<{ data: Supplier }>(`/stock/suppliers/${id}`, data);
		return response.data.data;
	},

	async deleteSupplier(id: string) {
		await apiClient.delete(`/stock/suppliers/${id}`);
	},
};
