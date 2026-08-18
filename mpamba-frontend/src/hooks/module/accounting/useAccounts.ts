import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountingAccountService } from '@/services/module/accounting/account.service';
import { CreateAccountingAccountDto, UpdateAccountingAccountDto } from '@/shared/dto/accounting.dto';
import { invalidateAccountingQueries, QueryOptions } from './utils';

export const useAccountingAccounts = (options?: QueryOptions) => {
	return useQuery({
		queryKey: ['accounting-accounts'],
		queryFn: () => accountingAccountService.listAccounts(),
		enabled: options?.enabled !== false,
	});
};

export const useAccountingAccount = (id: string) => {
	return useQuery({
		queryKey: ['accounting-account', id],
		queryFn: () => accountingAccountService.getAccountById(id),
		enabled: !!id,
	});
};

export const useCreateAccountingAccount = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateAccountingAccountDto) => accountingAccountService.createAccount(data),
		onSuccess: () => invalidateAccountingQueries(queryClient),
	});
};

export const useUpdateAccountingAccount = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateAccountingAccountDto }) => accountingAccountService.updateAccount(id, data),
		onSuccess: (_, { id }) => invalidateAccountingQueries(queryClient, id),
	});
};

export const useDeleteAccountingAccount = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => accountingAccountService.deleteAccount(id),
		onSuccess: () => invalidateAccountingQueries(queryClient),
	});
};
