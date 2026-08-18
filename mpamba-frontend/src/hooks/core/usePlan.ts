import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import planServices from '@/services/core/plan.services';
import { CreatePlanDto, UpdatePlanDto } from '@/shared/dto/plan.dto';

export const usePlans = (params?: { page?: number; pageSize?: number }) => {
	return useQuery({
		queryKey: ['plans', params],
		queryFn: () => planServices.list(params),
	});
};

export const usePlan = (code: string) => {
	return useQuery({
		queryKey: ['plan', code],
		queryFn: () => planServices.getByCode(code),
		enabled: !!code,
	});
};

export const useCreatePlan = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreatePlanDto) => planServices.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['plans'] });
		},
	});
};

export const useUpdatePlan = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdatePlanDto }) =>
			planServices.update(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['plans'] });
			queryClient.invalidateQueries({ queryKey: ['plan', id] });
		},
	});
};

export const useDeletePlan = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => planServices.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['plans'] });
		},
	});
};
