import apiClient from "@/shared/utils/api.utils";
import { CreateOrganizationDto, UpdateOrganizationDto, UpdateOwnOrganizationDto } from "@/shared/dto/organization.dto";
import { Organization } from "@/shared/types/models";

export const organizationService = {
	async list(params?: { page?: number; pageSize?: number }) {
		const response = await apiClient.get<{ data: Organization[]; pagination: any }>("/organizations", { params });
		return response.data;
	},

	async getMine() {
		const response = await apiClient.get<{ data: Organization }>("/organizations/me");
		return response.data.data;
	},

	async updateMine(data: UpdateOwnOrganizationDto) {
		const response = await apiClient.put<{ data: Organization }>("/organizations/me", data);
		return response.data.data;
	},

	async getById(id: string) {
		const response = await apiClient.get<Organization>(`/organizations/${id}`);
		return response.data;
	},

	async create(data: CreateOrganizationDto) {
		const response = await apiClient.post<Organization>("/organizations", data);
		return response.data;
	},

	async update(id: string, data: UpdateOrganizationDto) {
		const response = await apiClient.put<Organization>(`/organizations/${id}`, data);
		return response.data;
	},

	async delete(id: string) {
		await apiClient.delete(`/organizations/${id}`);
	},

	async assignModule(organizationId: string, moduleId: string) {
		const response = await apiClient.post(`/organizations/${organizationId}/modules/${moduleId}`);
		return response.data;
	},

	async removeModule(organizationId: string, moduleId: string) {
		await apiClient.delete(`/organizations/${organizationId}/modules/${moduleId}`);
	},
};

export default organizationService;
