import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import roleServices from '@/services/core/role.services';
import { CreateRoleDto, UpdateRoleDto } from '@/shared/dto/role.dto';

export const useRoles = (params?: { page?: number; pageSize?: number }) => {
	return useQuery({
		queryKey: ['roles', params],
		queryFn: () => roleServices.list(params),
	});
};

export const useRolesByModule = (moduleCode: string, params?: { page?: number; pageSize?: number }) => {
	return useQuery({
		queryKey: ['roles', 'module', moduleCode, params],
		queryFn: () => roleServices.getByModule(moduleCode, params),
		enabled: !!moduleCode,
	});
};

export const useRole = (id: string) => {
	return useQuery({
		queryKey: ['role', id],
		queryFn: async () => {
			if (!id) return null;
			try {
				const response = await roleServices.getById(id);
				return response || null;
			} catch (error: any) {
				if (error.response?.status === 404) {
					console.warn(`Role with id ${id} not found`);
					return null;
				}
				throw error;
			}
		},
		enabled: !!id,
	});
};

export const useCreateRole = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateRoleDto) => roleServices.create(data),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['roles'] });
		},
	});
};

export const useUpdateRole = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateRoleDto }) =>
			roleServices.update(id, data),
		onSuccess: async (_, { id }) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['roles'] }),
				queryClient.invalidateQueries({ queryKey: ['role', id] }),
			]);
		},
	});
};

export const useDeleteRole = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => roleServices.delete(id),
		onSuccess: async (_, id) => {
			queryClient.removeQueries({ queryKey: ['role', id] });
			await queryClient.invalidateQueries({ queryKey: ['roles'] });
		},
	});
};

export const useAttachPermissionToRole = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
			roleServices.attachPermission(roleId, permissionId),
		onSuccess: async (_, { roleId }) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['roles'] }),
				queryClient.invalidateQueries({ queryKey: ['role', roleId] }),
			]);
		},
	});
};

export const useDetachPermissionFromRole = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
			roleServices.detachPermission(roleId, permissionId),
		onSuccess: async (_, { roleId }) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['roles'] }),
				queryClient.invalidateQueries({ queryKey: ['role', roleId] }),
			]);
		},
	});
};
