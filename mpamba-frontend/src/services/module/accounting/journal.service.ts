import apiClient from '@/shared/utils/api.utils';
import { CreateManualEntryDto } from '@/shared/dto/accounting.dto';
import { AccountingPaginatedResponse, JournalEntry } from '@/shared/types/accounting.types';

export interface JournalEntryFilters {
	page?: number;
	pageSize?: number;
	startDate?: string;
	endDate?: string;
}

export const journalService = {
	async listEntries(params?: JournalEntryFilters) {
		const response = await apiClient.get<AccountingPaginatedResponse<JournalEntry>>('/accounting/entries', { params });
		return response.data;
	},

	async getEntryById(id: string) {
		const response = await apiClient.get<{ data: JournalEntry }>(`/accounting/entries/${id}`);
		return response.data.data;
	},

	async createManualEntry(data: CreateManualEntryDto) {
		const response = await apiClient.post<{ data: JournalEntry }>('/accounting/entries', data);
		return response.data.data;
	},

	async reverseEntry(id: string, reason?: string) {
		const response = await apiClient.post<{ data: JournalEntry }>(`/accounting/entries/${id}/reverse`, { reason });
		return response.data.data;
	},
};
