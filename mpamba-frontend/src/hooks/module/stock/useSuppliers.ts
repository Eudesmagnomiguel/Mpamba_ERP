import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '@/services/module/stock/supplier.service';
import { CreateSupplierDto, StockSupplierListFiltersDto, UpdateSupplierDto } from '@/shared/dto/stock.dto';
import { invalidateStockQueries } from './utils';

export const useStockSuppliers = (params?: StockSupplierListFiltersDto) => {
	return useQuery({
		queryKey: ['stock-suppliers', params],
		queryFn: () => supplierService.listSuppliers(params),
	});
};

export const useStockSupplier = (id: string) => {
	return useQuery({
		queryKey: ['stock-supplier', id],
		queryFn: () => supplierService.getSupplierById(id),
		enabled: !!id,
	});
};

export const useCreateStockSupplier = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateSupplierDto) => supplierService.createSupplier(data),
		onSuccess: () => {
			invalidateStockQueries(queryClient);
		},
	});
};

export const useUpdateStockSupplier = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateSupplierDto }) => supplierService.updateSupplier(id, data),
		onSuccess: () => {
			invalidateStockQueries(queryClient);
		},
	});
};

export const useDeleteStockSupplier = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => supplierService.deleteSupplier(id),
		onSuccess: () => {
			invalidateStockQueries(queryClient);
		},
	});
};
