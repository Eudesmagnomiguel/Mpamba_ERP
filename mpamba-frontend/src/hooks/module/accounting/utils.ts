import { QueryClient } from '@tanstack/react-query';

export const invalidateAccountingQueries = (queryClient: QueryClient, accountId?: string, entryId?: string) => {
	queryClient.invalidateQueries({ queryKey: ['accounting-accounts'] });
	queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
	queryClient.invalidateQueries({ queryKey: ['accounting-trial-balance'] });

	if (accountId) {
		queryClient.invalidateQueries({ queryKey: ['accounting-account', accountId] });
		queryClient.invalidateQueries({ queryKey: ['accounting-ledger', accountId] });
	}

	if (entryId) {
		queryClient.invalidateQueries({ queryKey: ['accounting-entry', entryId] });
	}
};

export interface QueryOptions {
	enabled?: boolean;
}
