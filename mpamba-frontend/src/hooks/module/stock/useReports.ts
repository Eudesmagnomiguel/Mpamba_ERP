import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/module/stock/report.service';
import { StockMostUsedFiltersDto } from '@/shared/dto/stock.dto';

export const useStockSummary = () => {
	return useQuery({
		queryKey: ['stock-summary'],
		queryFn: () => reportService.getSummary(),
	});
};

export const useMostUsedStockProducts = (params?: StockMostUsedFiltersDto) => {
	return useQuery({
		queryKey: ['stock-most-used', params],
		queryFn: () => reportService.getMostUsedProducts(params),
	});
};
