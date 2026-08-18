import apiClient from "@/shared/utils/api.utils";
import { CreateUserDto, UpdateUserDto } from "@/shared/dto/user.dto";
import { User } from "@/shared/types/models";

class UserService {
	async list(params?: { page?: number; pageSize?: number; organizationId?: string }) {
		const response = await apiClient.get<{ data: User[]; pagination: any }>("/users", { params });
		return response.data;
	}

	async getById(id: string) {
		const response = await apiClient.get<{ data: User }> (`/users/${id}`);
		return response.data.data;
	}

	async create(data: CreateUserDto) {
		const response = await apiClient.post<{ data: User }>("/users", data);
		return response.data.data;
	}

	async update(id: string, data: UpdateUserDto) {
		const response = await apiClient.put<{ data: User }>(`/users/${id}`, data);
		return response.data.data;
	}

	async delete(id: string) {
		await apiClient.delete(`/users/${id}`);
	}
}

export default new UserService();
