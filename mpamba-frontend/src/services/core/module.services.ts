import apiClient from "@/shared/utils/api.utils";
import { CreateModuleDto, UpdateModuleDto } from "@/shared/dto/module.dto";
import { Module } from "@/shared/types/models";

class ModuleService {
	async list(params?: { page?: number; pageSize?: number }) {
		const response = await apiClient.get<{ data: Module[]; pagination: any }>("/modules", { params });
		return response.data;
	}

	async getById(id: string) {
		const response = await apiClient.get<{ data: Module }>(`/modules/${id}`);
		return response.data.data;
	}

	async create(data: CreateModuleDto) {
		const response = await apiClient.post<{ data: Module }>("/modules", data);
		return response.data.data;
	}

	async update(id: string, data: UpdateModuleDto) {
		const response = await apiClient.put<{ data: Module }>(`/modules/${id}`, data);
		return response.data.data;
	}

	async delete(id: string) {
		await apiClient.delete(`/modules/${id}`);
	}
}

export default new ModuleService();
