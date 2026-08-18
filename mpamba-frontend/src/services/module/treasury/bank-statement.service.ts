import apiClient from '@/shared/utils/api.utils';
import { CreateBankStatementDto } from '@/shared/dto/treasury.dto';
import { BankStatement, FinancialMovement } from '@/shared/types/treasury.types';

export const bankStatementService = {
	async listStatements() {
		const response = await apiClient.get<{ data: BankStatement[] }>('/treasury/bank-statements');
		return response.data.data;
	},

	async getStatementById(id: string) {
		const response = await apiClient.get<{ data: BankStatement }>(`/treasury/bank-statements/${id}`);
		return response.data.data;
	},

	async createStatement(data: CreateBankStatementDto) {
		const response = await apiClient.post<{ data: BankStatement }>('/treasury/bank-statements', data);
		return response.data.data;
	},

	async autoMatch(statementId: string) {
		const response = await apiClient.post<{ data: { matchedCount: number; totalLines: number } }>(`/treasury/bank-statements/${statementId}/auto-match`);
		return response.data.data;
	},

	async manualMatch(lineId: string, movementId: string) {
		await apiClient.post(`/treasury/bank-statements/lines/${lineId}/match`, { movementId });
	},

	async unmatch(lineId: string) {
		await apiClient.post(`/treasury/bank-statements/lines/${lineId}/unmatch`);
	},

	async listUnmatchedMovements(statementId: string) {
		const response = await apiClient.get<{ data: FinancialMovement[] }>(`/treasury/bank-statements/${statementId}/unmatched-movements`);
		return response.data.data;
	},
};
