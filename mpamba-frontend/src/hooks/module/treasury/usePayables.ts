import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payableService } from '@/services/module/treasury/payable.service';
import { CreatePayableDto } from '@/shared/dto/treasury.dto';

export const usePayables = (status?: string) => {
	return useQuery({
		queryKey: ['treasury', 'payables', status],
		queryFn: () => payableService.listPayables(status),
	});
};

export const useCreatePayable = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreatePayableDto) => payableService.createPayable(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['treasury', 'payables'] });
		},
	});
};

export const useMarkPayableAsPaid = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => payableService.markAsPaid(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['treasury', 'payables'] });
		},
	});
};

export const useDeletePayable = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => payableService.deletePayable(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['treasury', 'payables'] });
		},
	});
};
