import apiClient from "@/shared/utils/api.utils";
import { DashboardStats } from "@/shared/types/dashboard.types";

class DashboardService {
	async getStats() {
		const response = await apiClient.get<{ data: DashboardStats }>("/dashboard/stats");
		return response.data.data;
	}
}

export default new DashboardService();
