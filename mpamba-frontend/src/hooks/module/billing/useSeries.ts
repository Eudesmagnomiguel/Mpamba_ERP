import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { seriesService } from '@/services/module/billing/series.service';
import { invalidateBillingQueries } from './utils';

export const useBillingSeries = () => {
	return useQuery({
		queryKey: ['billing-series'],
		queryFn: () => seriesService.listSeries(),
	});
};

export const useCreateBillingSeries = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: any) => seriesService.createSeries(data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useUpdateBillingSeries = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) => seriesService.updateSeries(id, data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useDeleteBillingSeries = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => seriesService.deleteSeries(id),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};
