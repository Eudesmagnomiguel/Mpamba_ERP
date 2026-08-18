import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taxService } from '@/services/module/billing/tax.service';
import { CreateTaxRuleDto, UpdateTaxRuleDto } from '@/shared/dto/billing.dto';
import { invalidateBillingQueries } from './utils';

export const useBillingTaxRules = () => {
	return useQuery({
		queryKey: ['billing-tax-rules'],
		queryFn: () => taxService.listTaxRules(),
	});
};

export const useCreateBillingTaxRule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateTaxRuleDto) => taxService.createTaxRule(data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useUpdateBillingTaxRule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateTaxRuleDto }) => taxService.updateTaxRule(id, data),
		onSuccess: () => invalidateBillingQueries(queryClient),
    });
};

export const useDeleteBillingTaxRule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => taxService.deleteTaxRule(id),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};
