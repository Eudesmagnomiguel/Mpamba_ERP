import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/module/stock/product.service';
import { CreateProductDto, StockProductListFiltersDto, UpdateProductDto } from '@/shared/dto/stock.dto';
import { invalidateStockQueries, QueryOptions } from './utils';

export const useStockProducts = (params?: StockProductListFiltersDto, options?: QueryOptions) => {
	return useQuery({
		queryKey: ['stock-products', params],
		queryFn: () => productService.listProducts(params),
		enabled: options?.enabled !== false,
	});
};

export const useStockProduct = (id: string) => {
	return useQuery({
		queryKey: ['stock-product', id],
		queryFn: () => productService.getProductById(id),
		enabled: !!id,
	});
};

export const useCreateStockProduct = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateProductDto) => productService.createProduct(data),
		onSuccess: () => {
			invalidateStockQueries(queryClient);
		},
	});
};

export const useUpdateStockProduct = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) => productService.updateProduct(id, data),
		onSuccess: (_, { id }) => {
			invalidateStockQueries(queryClient, id);
		},
	});
};

export const useDeleteStockProduct = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => productService.deleteProduct(id),
		onSuccess: () => {
			invalidateStockQueries(queryClient);
		},
	});
};
