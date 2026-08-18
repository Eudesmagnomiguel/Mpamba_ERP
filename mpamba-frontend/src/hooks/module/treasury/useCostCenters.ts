import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costCenterService } from '@/services/module/treasury/cost-center.service';
import { CreateCostCenterDto, UpdateCostCenterDto } from '@/shared/dto/treasury.dto';
import { CostCenter } from '@/shared/types/treasury.types';

export const useCostCenters = () => {
	return useQuery({
		queryKey: ['treasury', 'cost-centers'],
		queryFn: () => costCenterService.listCostCenters(),
	});
};

export const useCostCenter = (id: string) => {
	return useQuery({
		queryKey: ['treasury', 'cost-centers', id],
		queryFn: () => costCenterService.getCostCenterById(id),
		enabled: !!id,
	});
};

export const useCreateCostCenter = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateCostCenterDto) => costCenterService.createCostCenter(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['treasury', 'cost-centers'] });
		},
	});
};

export const useUpdateCostCenter = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateCostCenterDto }) =>
			costCenterService.updateCostCenter(id, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['treasury', 'cost-centers'] });
			queryClient.invalidateQueries({ queryKey: ['treasury', 'cost-centers', variables.id] });
		},
	});
};

export const useDeleteCostCenter = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => costCenterService.deleteCostCenter(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['treasury', 'cost-centers'] });
		},
	});
};
