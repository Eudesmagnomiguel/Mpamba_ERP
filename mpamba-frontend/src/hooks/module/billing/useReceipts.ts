import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { receiptService } from '@/services/module/billing/receipt.service';
import { invalidateBillingQueries } from './utils';

export const useBillingReceipts = (params?: any) => {
	return useQuery({
		queryKey: ['billing-receipts', params],
		queryFn: () => receiptService.listReceipts(params),
	});
};

export const useCreateBillingReceipt = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: any) => receiptService.createReceipt(data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useIssueReceipt = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => receiptService.issueReceipt(id),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};
