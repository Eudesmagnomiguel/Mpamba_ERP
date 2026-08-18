import apiClient from "@/shared/utils/api.utils";

export interface SubscriptionRequest {
    id: string;
    organizationId: string;
    planId: string;
    type: 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    notes?: string;
    paymentReference?: string;
    adminResponse?: string;
    activationCode?: string;
    createdAt: string;
    plan?: {
        name: string;
        price: number;
    };
    organization?: {
        name: string;
    };
}

class SubscriptionRequestService {
    async create(data: { planId: string; type: 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE'; notes?: string; paymentReference?: string }) {
        const response = await apiClient.post<{ data: SubscriptionRequest }>("/subscription-requests", data);
        return response.data.data;
    }

    async getMyRequests() {
        const response = await apiClient.get<{ data: SubscriptionRequest[] }>("/subscription-requests/me");
        return response.data.data;
    }

    async getAllRequests(status?: string) {
        const response = await apiClient.get<{ data: SubscriptionRequest[] }>("/subscription-requests/admin", { params: { status } });
        return response.data.data;
    }

    async approve(id: string, adminResponse?: string) {
        const response = await apiClient.post<{ data: SubscriptionRequest }>(`/subscription-requests/admin/${id}/approve`, { adminResponse });
        return response.data.data;
    }

    async reject(id: string, adminResponse: string) {
        const response = await apiClient.post<{ data: SubscriptionRequest }>(`/subscription-requests/admin/${id}/reject`, { adminResponse });
        return response.data.data;
    }
}

export default new SubscriptionRequestService();
