import apiClient from "@/shared/utils/api.utils";
import { CreateRoleDto, UpdateRoleDto } from "@/shared/dto/role.dto";
import { Role } from "@/shared/types/models";

class RoleService {
	async list(params?: { page?: number; pageSize?: number }) {
		const response = await apiClient.get<{ data: Role[]; pagination: any }>("/roles", { params });
		return response.data;
	}

	async getById(id: string) {
		const response = await apiClient.get<any>(`/roles/${id}`);
		// backend may return either the role directly or { data: role }
		return response.data && response.data.data ? response.data.data : response.data;
	}

	async getByModule(moduleCode: string, params?: { page?: number; pageSize?: number }) {
		const response = await apiClient.get<{ data: Role[]; pagination: any }>(`/roles/module/${moduleCode}`, { params });
		return response.data;
	}

	async create(data: CreateRoleDto) {
		const response = await apiClient.post<any>("/roles", data);
		return response.data && response.data.data ? response.data.data : response.data;
	}

	async update(id: string, data: UpdateRoleDto) {
		const response = await apiClient.put<any>(`/roles/${id}`, data);
		return response.data && response.data.data ? response.data.data : response.data;
	}

	async attachPermission(roleId: string, permissionId: string) {
		const response = await apiClient.post<any>(`/roles/${roleId}/permissions`, { permissionId });
		return response.data && response.data.data ? response.data.data : response.data;
	}

	async detachPermission(roleId: string, permissionId: string) {
		const response = await apiClient.delete<any>(`/roles/${roleId}/permissions/${permissionId}`);
		return response.data && response.data.data ? response.data.data : response.data;
	}

	async delete(id: string) {
		await apiClient.delete(`/roles/${id}`);
	}
}

export default new RoleService();
