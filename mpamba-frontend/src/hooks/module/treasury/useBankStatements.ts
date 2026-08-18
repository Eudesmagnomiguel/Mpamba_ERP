import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bankStatementService } from '@/services/module/treasury/bank-statement.service';
import { CreateBankStatementDto } from '@/shared/dto/treasury.dto';
import { invalidateTreasuryQueries } from './utils';

export const useBankStatements = () => {
	return useQuery({
		queryKey: ['treasury-bank-statements'],
		queryFn: () => bankStatementService.listStatements(),
	});
};

export const useBankStatement = (id: string) => {
	return useQuery({
		queryKey: ['treasury-bank-statement', id],
		queryFn: () => bankStatementService.getStatementById(id),
		enabled: !!id,
	});
};

export const useUnmatchedMovements = (statementId: string) => {
	return useQuery({
		queryKey: ['treasury-bank-statement-unmatched', statementId],
		queryFn: () => bankStatementService.listUnmatchedMovements(statementId),
		enabled: !!statementId,
	});
};

export const useCreateBankStatement = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateBankStatementDto) => bankStatementService.createStatement(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['treasury-bank-statements'] });
		},
	});
};

export const useAutoMatchStatement = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (statementId: string) => bankStatementService.autoMatch(statementId),
		onSuccess: (_, statementId) => {
			queryClient.invalidateQueries({ queryKey: ['treasury-bank-statements'] });
			queryClient.invalidateQueries({ queryKey: ['treasury-bank-statement', statementId] });
			queryClient.invalidateQueries({ queryKey: ['treasury-bank-statement-unmatched', statementId] });
			invalidateTreasuryQueries(queryClient);
		},
	});
};

export const useManualMatchLine = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ lineId, movementId, statementId }: { lineId: string; movementId: string; statementId: string }) =>
			bankStatementService.manualMatch(lineId, movementId),
		onSuccess: (_, { statementId }) => {
			queryClient.invalidateQueries({ queryKey: ['treasury-bank-statements'] });
			queryClient.invalidateQueries({ queryKey: ['treasury-bank-statement', statementId] });
			queryClient.invalidateQueries({ queryKey: ['treasury-bank-statement-unmatched', statementId] });
			invalidateTreasuryQueries(queryClient);
		},
	});
};

export const useUnmatchLine = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ lineId }: { lineId: string; statementId: string }) => bankStatementService.unmatch(lineId),
		onSuccess: (_, { statementId }) => {
			queryClient.invalidateQueries({ queryKey: ['treasury-bank-statements'] });
			queryClient.invalidateQueries({ queryKey: ['treasury-bank-statement', statementId] });
			queryClient.invalidateQueries({ queryKey: ['treasury-bank-statement-unmatched', statementId] });
			invalidateTreasuryQueries(queryClient);
		},
	});
};
