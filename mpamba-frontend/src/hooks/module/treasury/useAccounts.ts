import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountService } from '@/services/module/treasury/account.service';
import { AccountListFiltersDto, CreateFinancialAccountDto, UpdateFinancialAccountDto } from '@/shared/dto/treasury.dto';
import { invalidateTreasuryQueries, QueryOptions } from './utils';

export const useAccounts = (params?: AccountListFiltersDto, options?: QueryOptions) => {
	return useQuery({
		queryKey: ['treasury-accounts', params],
		queryFn: () => accountService.listAccounts(params),
		enabled: options?.enabled !== false,
	});
};

export const useAccount = (id: string) => {
	return useQuery({
		queryKey: ['treasury-account', id],
		queryFn: () => accountService.getAccountById(id),
		enabled: !!id,
	});
};

export const useCreateAccount = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateFinancialAccountDto) => accountService.createAccount(data),
		onSuccess: () => {
			invalidateTreasuryQueries(queryClient);
		},
	});
};

export const useUpdateAccount = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateFinancialAccountDto }) => accountService.updateAccount(id, data),
		onSuccess: (_, { id }) => {
			invalidateTreasuryQueries(queryClient, id);
		},
	});
};

export const useDeleteAccount = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => accountService.deleteAccount(id),
		onSuccess: () => {
			invalidateTreasuryQueries(queryClient);
		},
	});
};
