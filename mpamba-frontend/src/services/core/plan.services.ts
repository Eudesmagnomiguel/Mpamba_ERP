import apiClient from "@/shared/utils/api.utils";
import { CreatePlanDto, UpdatePlanDto } from "@/shared/dto/plan.dto";
import { Plan } from "@/shared/types/models";

class PlanService {
	async list(params?: { page?: number; pageSize?: number }) {
		const response = await apiClient.get<{ data: Plan[]; pagination: any }>("/plans", { params });
		return response.data;
	}

	async getByCode(code: string) {
		const response = await apiClient.get<{ data: Plan }>(`/plans/${code}`);
		return response.data.data;
	}

	async create(data: CreatePlanDto) {
		const response = await apiClient.post<Plan>("/plans", data);
		return response.data;
	}

	async update(id: string, data: UpdatePlanDto) {
		const response = await apiClient.put<Plan>(`/plans/${id}`, data);
		return response.data;
	}

	async delete(id: string) {
		await apiClient.delete(`/plans/${id}`);
	}
}

export default new PlanService();
