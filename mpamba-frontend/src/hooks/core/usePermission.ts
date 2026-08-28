import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import permissionServices from '@/services/core/permission.services';
import { CreatePermissionDto } from '@/shared/dto/permission.dto';
import { useAuthStore } from '@/store/auth.store';

/**
 * O backend reconhece o super administrador por dois nomes de papel
 * ('SUPER_ADMIN' e 'Super Administrador', o nome usado no seed). O frontend
 * só reconhecia o primeiro, pelo que o super admin do seed ficava sem botões
 * de criação mesmo tendo acesso garantido na API.
 */
export const isSuperAdminRole = (role?: string | null) =>
	role === 'SUPER_ADMIN' || role === 'Super Administrador';

export const useHasPermission = (permissionCode: string) => {
	const { user } = useAuthStore();
	if (!user) return false;
	if (isSuperAdminRole(user.role)) return true;
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
