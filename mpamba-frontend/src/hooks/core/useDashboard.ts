import { useQuery } from '@tanstack/react-query';
import dashboardService from '@/services/core/dashboard.services';

export const useDashboardStats = () => {
	return useQuery({
		queryKey: ['admin-stats'],
		queryFn: () => dashboardService.getStats(),
	});
};
