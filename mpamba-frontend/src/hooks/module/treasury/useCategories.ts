import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/module/treasury/category.service';
import { CategoryListFiltersDto, CreateFinancialCategoryDto, UpdateFinancialCategoryDto } from '@/shared/dto/treasury.dto';
import { invalidateTreasuryQueries, QueryOptions } from './utils';

export const useCategories = (params?: CategoryListFiltersDto, options?: QueryOptions) => {
	return useQuery({
		queryKey: ['treasury-categories', params],
		queryFn: () => categoryService.listCategories(params),
		enabled: options?.enabled !== false,
	});
};

export const useCategory = (id: string) => {
	return useQuery({
		queryKey: ['treasury-category', id],
		queryFn: () => categoryService.getCategoryById(id),
		enabled: !!id,
	});
};

export const useCreateCategory = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateFinancialCategoryDto) => categoryService.createCategory(data),
		onSuccess: () => {
			invalidateTreasuryQueries(queryClient);
		},
	});
};

export const useUpdateCategory = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateFinancialCategoryDto }) => categoryService.updateCategory(id, data),
		onSuccess: (_, { id }) => {
			invalidateTreasuryQueries(queryClient, undefined, id);
		},
	});
};

export const useDeleteCategory = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => categoryService.deleteCategory(id),
		onSuccess: () => {
			invalidateTreasuryQueries(queryClient);
		},
	});
};
