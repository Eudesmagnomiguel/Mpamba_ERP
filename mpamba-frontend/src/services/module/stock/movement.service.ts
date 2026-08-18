import apiClient from '@/shared/utils/api.utils';
import {
	AddStockDto,
	AdjustStockDto,
	ReversalDto,
	RemoveStockDto,
	StockMovementListFiltersDto,
} from '@/shared/dto/stock.dto';
import {
	StockAdjustmentResult,
	StockMovement,
	StockPaginatedResponse,
	StockProductMovementResult,
	StockReversalResult,
} from '@/shared/types/stock.types';

export const movementService = {
	async listMovements(params?: StockMovementListFiltersDto) {
		const response = await apiClient.get<StockPaginatedResponse<StockMovement>>('/stock/movements', { params });
		return response.data;
	},

	async addStock(productId: string, data: AddStockDto) {
		const response = await apiClient.post<{ data: StockProductMovementResult }>(`/stock/movements/products/${productId}/add`, data);
		return response.data.data;
	},

	async removeStock(productId: string, data: RemoveStockDto) {
		const response = await apiClient.post<{ data: StockProductMovementResult }>(`/stock/movements/products/${productId}/remove`, data);
		return response.data.data;
	},

	async adjustStock(productId: string, data: AdjustStockDto) {
		const response = await apiClient.post<{ data: StockAdjustmentResult }>(`/stock/movements/products/${productId}/adjust`, data);
		return response.data.data;
	},

	async reverseMovement(movementId: string, data: ReversalDto) {
		const response = await apiClient.post<{ data: StockReversalResult }>(`/stock/movements/${movementId}/reverse`, data);
		return response.data.data;
	},
};
