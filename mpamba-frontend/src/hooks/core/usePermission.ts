import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import permissionServices from '@/services/core/permission.services';
import { CreatePermissionDto } from '@/shared/dto/permission.dto';
import { useAuthStore } from '@/store/auth.store';

export const useHasPermission = (permissionCode: string) => {
	const { user } = useAuthStore();
	if (!user) return false;
	if (user.role === 'SUPER_ADMIN') return true;
	return user.permissions?.includes(permissionCode) ?? false;
};
export const usePermissions = (params?: { page?: number; pageSize?: number }) => {
	return useQuery({
		queryKey: ['permissions', params],
		queryFn: () => permissionServices.list(params),
	});
};

export const useCreatePermission = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreatePermissionDto) => permissionServices.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['permissions'] });
		},
	});
};

export const usePermission = (id?: string) => {
	return useQuery({
		queryKey: ['permission', id],
		enabled: !!id,
		queryFn: () => permissionServices.getById(id as string),
	});
};

export const useUpdatePermission = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: { id: string; data: CreatePermissionDto }) => permissionServices.update(payload.id, payload.data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['permissions'] });
			queryClient.invalidateQueries({ queryKey: ['permission'] });
		}
	});
};
