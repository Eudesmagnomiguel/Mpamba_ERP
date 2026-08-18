import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/services/module/billing/stats.service';

export const useBillingStats = () => {
	return useQuery({
		queryKey: ['billing-stats'],
		queryFn: () => statsService.getStats(),
	});
};
