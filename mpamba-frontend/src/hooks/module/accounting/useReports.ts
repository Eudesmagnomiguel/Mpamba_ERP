import { useQuery } from '@tanstack/react-query';
import { accountingReportService, AccountingReportFilters, BalanceSheetFilters } from '@/services/module/accounting/report.service';
import { QueryOptions } from './utils';

export const useTrialBalance = (params?: AccountingReportFilters, options?: QueryOptions) => {
	return useQuery({
		queryKey: ['accounting-trial-balance', params],
		queryFn: () => accountingReportService.getTrialBalance(params),
		enabled: options?.enabled !== false,
	});
};

export const useAccountLedger = (accountId: string, params?: AccountingReportFilters) => {
	return useQuery({
		queryKey: ['accounting-ledger', accountId, params],
		queryFn: () => accountingReportService.getLedger(accountId, params),
		enabled: !!accountId,
	});
};

export const useIncomeStatement = (params?: AccountingReportFilters, options?: QueryOptions) => {
	return useQuery({
		queryKey: ['accounting-income-statement', params],
		queryFn: () => accountingReportService.getIncomeStatement(params),
		enabled: options?.enabled !== false,
	});
};

/** Balanço — recebe apenas `asOfDate` (ponto no tempo), nunca `startDate`/`endDate`. */
export const useBalanceSheet = (params?: BalanceSheetFilters, options?: QueryOptions) => {
	return useQuery({
		queryKey: ['accounting-balance-sheet', params],
		queryFn: () => accountingReportService.getBalanceSheet(params),
		enabled: options?.enabled !== false,
	});
};
