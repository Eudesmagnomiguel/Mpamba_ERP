import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { proformaService } from '@/services/module/billing/proforma.service';
import { invalidateBillingQueries } from './utils';

export const useBillingProformas = (params?: any) => {
	return useQuery({
		queryKey: ['billing-proformas', params],
		queryFn: () => proformaService.listProformas(params),
	});
};

export const useBillingProforma = (id: string) => {
	return useQuery({
		queryKey: ['billing-proforma', id],
		queryFn: () => proformaService.getProformaById(id),
		enabled: !!id,
	});
};

export const useCreateBillingProforma = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: any) => proformaService.createProforma(data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useConvertProforma = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data?: any }) =>
			proformaService.convertProformaToInvoice(id, data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};
