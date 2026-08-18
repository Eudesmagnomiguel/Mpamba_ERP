import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userServices from '@/services/core/user.services';
import { CreateUserDto, UpdateUserDto } from '@/shared/dto/user.dto';

export const useUsers = (params?: { page?: number; pageSize?: number; organizationId?: string }) => {
	return useQuery({
		queryKey: ['users', params],
		queryFn: () => userServices.list(params),
	});
};

export const useUser = (id: string) => {
	return useQuery({
		queryKey: ['user', id],
		queryFn: () => userServices.getById(id),
		enabled: !!id,
	});
};

export const useCreateUser = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateUserDto) => userServices.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
		},
	});
};

export const useUpdateUser = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
			userServices.update(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			queryClient.invalidateQueries({ queryKey: ['user', id] });
		},
	});
};

export const useDeleteUser = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => userServices.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
		},
	});
};
