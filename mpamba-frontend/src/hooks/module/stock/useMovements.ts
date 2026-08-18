import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { movementService } from '@/services/module/stock/movement.service';
import { AddStockDto, AdjustStockDto, RemoveStockDto, ReversalDto, StockMovementListFiltersDto } from '@/shared/dto/stock.dto';
import { invalidateStockQueries } from './utils';

export const useStockMovements = (params?: StockMovementListFiltersDto) => {
	return useQuery({
		queryKey: ['stock-movements', params],
		queryFn: () => movementService.listMovements(params),
	});
};

export const useAddStock = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ productId, data }: { productId: string; data: AddStockDto }) =>
			movementService.addStock(productId, data),
		onSuccess: (_, { productId }) => {
			invalidateStockQueries(queryClient, productId);
		},
	});
};

export const useRemoveStock = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ productId, data }: { productId: string; data: RemoveStockDto }) =>
			movementService.removeStock(productId, data),
		onSuccess: (_, { productId }) => {
			invalidateStockQueries(queryClient, productId);
		},
	});
};

export const useAdjustStock = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ productId, data }: { productId: string; data: AdjustStockDto }) =>
			movementService.adjustStock(productId, data),
		onSuccess: (_, { productId }) => {
			invalidateStockQueries(queryClient, productId);
		},
	});
};

export const useReverseStockMovement = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ movementId, data }: { movementId: string; data: ReversalDto }) =>
			movementService.reverseMovement(movementId, data),
		onSuccess: (_, { movementId }) => {
			invalidateStockQueries(queryClient, undefined, movementId);
		},
	});
};
