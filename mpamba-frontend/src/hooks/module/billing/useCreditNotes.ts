import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { creditNoteService } from '@/services/module/billing/credit-note.service';
import { invalidateBillingQueries } from './utils';

export const useBillingCreditNotes = (params?: any) => {
	return useQuery({
		queryKey: ['billing-credit-notes', params],
		queryFn: () => creditNoteService.listCreditNotes(params),
	});
};

export const useCreateBillingCreditNote = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: any) => creditNoteService.createCreditNote(data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useIssueCreditNote = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => creditNoteService.issueCreditNote(id),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};
