import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receivableService } from '@/services/module/treasury/receivable.service';
import { CreateReceivableDto } from '@/shared/dto/treasury.dto';

export const useReceivables = (status?: string) => {
	return useQuery({
		queryKey: ['treasury', 'receivables', status],
		queryFn: () => receivableService.listReceivables(status),
	});
};

export const useCreateReceivable = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateReceivableDto) => receivableService.createReceivable(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['treasury', 'receivables'] });
		},
	});
};

export const useMarkReceivableAsPaid = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => receivableService.markAsPaid(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['treasury', 'receivables'] });
		},
	});
};

export const useDeleteReceivable = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => receivableService.deleteReceivable(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['treasury', 'receivables'] });
		},
	});
};
