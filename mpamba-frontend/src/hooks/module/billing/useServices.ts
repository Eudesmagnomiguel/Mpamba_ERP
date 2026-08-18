import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogService } from '@/services/module/billing/service.service';
import { CreateServiceDto, UpdateServiceDto } from '@/shared/dto/billing.dto';
import { invalidateBillingQueries } from './utils';

export const useBillingServices = (params?: any) => {
	return useQuery({
		queryKey: ['billing-services', params],
		queryFn: () => catalogService.listServices(params),
	});
};

export const useBillingService = (id: string) => {
	return useQuery({
		queryKey: ['billing-service', id],
		queryFn: () => catalogService.getServiceById(id),
		enabled: !!id,
	});
};

export const useCreateBillingService = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateServiceDto) => catalogService.createService(data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useUpdateBillingService = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateServiceDto }) =>
			catalogService.updateService(id, data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useDeleteBillingService = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => catalogService.deleteService(id),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};
