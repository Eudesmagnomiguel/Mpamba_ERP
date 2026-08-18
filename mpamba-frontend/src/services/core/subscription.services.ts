import apiClient from "@/shared/utils/api.utils";
import { 
    RedeemCodeDto, 
    SubscriptionListFiltersDto, 
    SuspendSubscriptionDto, 
    ExtendSubscriptionDto, 
    ChangeSubscriptionPlanDto, 
    CancelSubscriptionDto 
} from "@/shared/dto/subscription.dto";
import { Subscription } from "@/shared/types/models";

class SubscriptionService {
    /**
     * Consulta o estado atual da subscrição da organização logada
     */
    async getMySubscription() {
        const response = await apiClient.get<{ data: any }>("/subscription/me");
        return response.data.data;
    }

    /**
     * Resgata um código de ativação para fazer upgrade ou renovar
     */
    async redeemCode(data: RedeemCodeDto) {
        const response = await apiClient.post<{ message: string; data: any }>("/subscription/redeem", data);
        return response.data;
    }

    /**
     * 👨‍💼 SUPER ADMIN - Lista todas as subscrições
     */
    async getAllSubscriptions(params?: SubscriptionListFiltersDto) {
        const response = await apiClient.get<{ data: Subscription[]; pagination: any }>("/subscription/admin", { params });
        return response.data;
    }

    /**
     * 👨‍💼 SUPER ADMIN - Pega subscrição de uma organização
     */
    async getSubscriptionByOrganizationId(organizationId: string) {
        const response = await apiClient.get<{ data: Subscription }>(`/subscription/admin/${organizationId}`);
        return response.data.data;
    }

    /**
     * 👨‍💼 SUPER ADMIN - Suspende a subscrição
     */
    async suspendSubscription(organizationId: string, data: SuspendSubscriptionDto) {
        const response = await apiClient.post<{ message: string; data: Subscription }>(`/subscription/admin/${organizationId}/suspend`, data);
        return response.data;
    }

    /**
     * 👨‍💼 SUPER ADMIN - Reativa uma subscrição
     */
    async resumeSubscription(organizationId: string) {
        const response = await apiClient.post<{ message: string; data: Subscription }>(`/subscription/admin/${organizationId}/resume`);
        return response.data;
    }

    /**
     * 👨‍💼 SUPER ADMIN - Estende a subscrição
     */
    async extendSubscription(organizationId: string, data: ExtendSubscriptionDto) {
        const response = await apiClient.post<{ message: string; data: Subscription }>(`/subscription/admin/${organizationId}/extend`, data);
        return response.data;
    }

    /**
     * 👨‍💼 SUPER ADMIN - Marca a subscrição como expirada
     */
    async expireSubscription(organizationId: string) {
        const response = await apiClient.post<{ message: string; data: Subscription }>(`/subscription/admin/${organizationId}/expire`);
        return response.data;
    }

    /**
     * 👨‍💼 SUPER ADMIN - Muda o plano da subscrição
     */
    async changeSubscriptionPlan(organizationId: string, data: ChangeSubscriptionPlanDto) {
        const response = await apiClient.post<{ message: string; data: Subscription }>(`/subscription/admin/${organizationId}/change-plan`, data);
        return response.data;
    }

    /**
     * 👨‍💼 SUPER ADMIN - Cancela a subscrição
     */
    async cancelSubscription(organizationId: string, data: CancelSubscriptionDto) {
        const response = await apiClient.post<{ message: string; data: Subscription }>(`/subscription/admin/${organizationId}/cancel`, data);
        return response.data;
    }
}

export default new SubscriptionService();
