import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/module/billing/customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from '@/shared/dto/billing.dto';
import { invalidateBillingQueries } from './utils';

export const useBillingCustomers = (params?: any) => {
	return useQuery({
		queryKey: ['billing-customers', params],
		queryFn: () => customerService.listCustomers(params),
	});
};

export const useBillingCustomer = (id: string) => {
	return useQuery({
		queryKey: ['billing-customer', id],
		queryFn: () => customerService.getCustomerById(id),
		enabled: !!id,
	});
};

export const useCreateBillingCustomer = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateCustomerDto) => customerService.createCustomer(data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useUpdateBillingCustomer = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateCustomerDto }) =>
			customerService.updateCustomer(id, data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useDeleteBillingCustomer = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => customerService.deleteCustomer(id),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};
