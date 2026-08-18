import { QueryClient } from '@tanstack/react-query';

export const invalidateTreasuryQueries = (queryClient: QueryClient, accountId?: string, categoryId?: string, movementId?: string) => {
	queryClient.invalidateQueries({ queryKey: ['treasury-accounts'] });
	queryClient.invalidateQueries({ queryKey: ['treasury-categories'] });
	queryClient.invalidateQueries({ queryKey: ['treasury-movements'] });
	queryClient.invalidateQueries({ queryKey: ['treasury-summary'] });

	if (accountId) {
		queryClient.invalidateQueries({ queryKey: ['treasury-account', accountId] });
	}

	if (categoryId) {
		queryClient.invalidateQueries({ queryKey: ['treasury-category', categoryId] });
	}

	if (movementId) {
		queryClient.invalidateQueries({ queryKey: ['treasury-movement', movementId] });
	}
};

export interface QueryOptions {
	enabled?: boolean;
}
