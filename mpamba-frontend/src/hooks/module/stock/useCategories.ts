import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/module/stock/category.service';
import { CreateCategoryDto, StockCategoryListFiltersDto, UpdateCategoryDto } from '@/shared/dto/stock.dto';
import { invalidateStockQueries } from './utils';

export const useStockCategories = (params?: StockCategoryListFiltersDto) => {
	return useQuery({
		queryKey: ['stock-categories', params],
		queryFn: () => categoryService.listCategories(params),
	});
};

export const useStockCategory = (id: string) => {
	return useQuery({
		queryKey: ['stock-category', id],
		queryFn: () => categoryService.getCategoryById(id),
		enabled: !!id,
	});
};

export const useCreateStockCategory = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateCategoryDto) => categoryService.createCategory(data),
		onSuccess: () => {
			invalidateStockQueries(queryClient);
		},
	});
};

export const useUpdateStockCategory = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) => categoryService.updateCategory(id, data),
		onSuccess: () => {
			invalidateStockQueries(queryClient);
		},
	});
};

export const useDeleteStockCategory = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => categoryService.deleteCategory(id),
		onSuccess: () => {
			invalidateStockQueries(queryClient);
		},
	});
};
