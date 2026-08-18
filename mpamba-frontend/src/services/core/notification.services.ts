import apiClient from "@/shared/utils/api.utils";
import { AppNotification, CreateNotificationDto } from "@/shared/types/notification.types";

class NotificationService {
	async list(params?: { page?: number; pageSize?: number }) {
		const response = await apiClient.get<{ data: AppNotification[]; pagination: any }>("/notifications/me", { params });
		return response.data;
	}

	async unreadCount() {
		const response = await apiClient.get<{ count: number }>("/notifications/me/unread-count");
		return response.data.count;
	}

	async markRead(id: string) {
		const response = await apiClient.post(`/notifications/me/${id}/read`);
		return response.data;
	}

	async markAllRead() {
		const response = await apiClient.post("/notifications/me/read-all");
		return response.data;
	}

	async send(data: CreateNotificationDto) {
		const response = await apiClient.post("/notifications", data);
		return response.data;
	}
}

export default new NotificationService();
