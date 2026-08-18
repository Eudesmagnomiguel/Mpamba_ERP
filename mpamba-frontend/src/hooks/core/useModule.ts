import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moduleServices from '@/services/core/module.services';
import { CreateModuleDto, UpdateModuleDto } from '@/shared/dto/module.dto';

export const useModules = (params?: { page?: number; pageSize?: number }) => {
	return useQuery({
		queryKey: ['modules', params],
		queryFn: () => moduleServices.list(params),
	});
};

export const useModule = (id: string) => {
	return useQuery({
		queryKey: ['module', id],
		queryFn: async () => {
			if (!id) return null;
			const response = await moduleServices.getById(id);
			return response || null;
		},
		enabled: !!id,
	});
};

export const useCreateModule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateModuleDto) => moduleServices.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['modules'] });
		},
	});
};

export const useUpdateModule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateModuleDto }) =>
			moduleServices.update(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['modules'] });
			queryClient.invalidateQueries({ queryKey: ['module', id] });
		},
	});
};

export const useDeleteModule = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => moduleServices.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['modules'] });
		},
	});
};
