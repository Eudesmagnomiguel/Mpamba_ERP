import { QueryClient } from '@tanstack/react-query';

export const invalidateBillingQueries = (queryClient: QueryClient) => {
	queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
	queryClient.invalidateQueries({ queryKey: ['billing-customers'] });
	queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
	queryClient.invalidateQueries({ queryKey: ['billing-proformas'] });
	queryClient.invalidateQueries({ queryKey: ['billing-credit-notes'] });
	queryClient.invalidateQueries({ queryKey: ['billing-receipts'] });
	queryClient.invalidateQueries({ queryKey: ['billing-series'] });
	queryClient.invalidateQueries({ queryKey: ['billing-services'] });
	queryClient.invalidateQueries({ queryKey: ['billing-tax-rules'] });
};
