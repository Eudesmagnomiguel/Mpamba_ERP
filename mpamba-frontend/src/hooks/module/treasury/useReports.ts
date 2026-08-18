import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/module/treasury/report.service';
import { QueryOptions } from './utils';

export const useTreasurySummary = (params?: { startDate?: string; endDate?: string }, options?: QueryOptions) => {
	return useQuery({
		queryKey: ['treasury-summary', params],
		queryFn: () => reportService.getSummary(params),
		enabled: options?.enabled !== false,
	});
};
