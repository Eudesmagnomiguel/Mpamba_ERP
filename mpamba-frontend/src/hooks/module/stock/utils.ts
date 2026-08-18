import { QueryClient } from '@tanstack/react-query';

export const invalidateStockQueries = (queryClient: QueryClient, productId?: string, movementId?: string) => {
	queryClient.invalidateQueries({ queryKey: ['stock-products'] });
	queryClient.invalidateQueries({ queryKey: ['stock-product', productId] });
	queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
	queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
	queryClient.invalidateQueries({ queryKey: ['stock-most-used'] });
	queryClient.invalidateQueries({ queryKey: ['stock-categories'] });
	queryClient.invalidateQueries({ queryKey: ['stock-suppliers'] });

	if (movementId) {
		queryClient.invalidateQueries({ queryKey: ['stock-movement', movementId] });
	}
};

export interface QueryOptions {
	enabled?: boolean;
}
