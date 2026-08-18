import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { journalService, JournalEntryFilters } from '@/services/module/accounting/journal.service';
import { CreateManualEntryDto } from '@/shared/dto/accounting.dto';
import { invalidateAccountingQueries, QueryOptions } from './utils';

export const useJournalEntries = (params?: JournalEntryFilters, options?: QueryOptions) => {
	return useQuery({
		queryKey: ['accounting-entries', params],
		queryFn: () => journalService.listEntries(params),
		enabled: options?.enabled !== false,
	});
};

export const useJournalEntry = (id: string) => {
	return useQuery({
		queryKey: ['accounting-entry', id],
		queryFn: () => journalService.getEntryById(id),
		enabled: !!id,
	});
};

export const useCreateManualEntry = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateManualEntryDto) => journalService.createManualEntry(data),
		onSuccess: () => invalidateAccountingQueries(queryClient),
	});
};

export const useReverseEntry = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, reason }: { id: string; reason?: string }) => journalService.reverseEntry(id, reason),
		onSuccess: (_, { id }) => invalidateAccountingQueries(queryClient, undefined, id),
	});
};
