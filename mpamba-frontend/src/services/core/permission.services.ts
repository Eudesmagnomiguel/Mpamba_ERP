import apiClient from "@/shared/utils/api.utils";
import { CreatePermissionDto } from "@/shared/dto/permission.dto";
import { Permission } from "@/shared/types/models";

class PermissionService {
	async list(params?: { page?: number; pageSize?: number }) {
		const response = await apiClient.get<{ data: Permission[]; total: number; page: number; pageSize: number }>("/permissions", { params });
		return response.data;
	}

	async create(data: CreatePermissionDto) {
		const response = await apiClient.post<Permission>("/permissions", data);
		return response.data;
	}

	async getById(id: string) {
		const response = await apiClient.get<Permission>(`/permissions/${id}`);
		return response.data;
	}

	async update(id: string, data: CreatePermissionDto) {
		const response = await apiClient.put<Permission>(`/permissions/${id}`, data);
		return response.data;
	}
}

export default new PermissionService();
