import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { movementService } from '@/services/module/treasury/movement.service';
import { CreateMovementDto, CreateTransferDto, MovementListFiltersDto } from '@/shared/dto/treasury.dto';
import { invalidateTreasuryQueries, QueryOptions } from './utils';

export const useMovements = (params?: MovementListFiltersDto, options?: QueryOptions) => {
	return useQuery({
		queryKey: ['treasury-movements', params],
		queryFn: () => movementService.listMovements(params),
		enabled: options?.enabled !== false,
	});
};

export const useMovement = (id: string) => {
	return useQuery({
		queryKey: ['treasury-movement', id],
		queryFn: () => movementService.getMovementById(id),
		enabled: !!id,
	});
};

export const useCreateMovement = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateMovementDto) => movementService.createMovement(data),
		onSuccess: () => {
			invalidateTreasuryQueries(queryClient);
		},
	});
};

export const useCreateTransfer = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateTransferDto) => movementService.createTransfer(data),
		onSuccess: () => {
			invalidateTreasuryQueries(queryClient);
		},
	});
};

export const useDeleteMovement = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => movementService.deleteMovement(id),
		onSuccess: () => {
			invalidateTreasuryQueries(queryClient);
		},
	});
};
