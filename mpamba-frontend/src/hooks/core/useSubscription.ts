import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import subscriptionServices from '@/services/core/subscription.services';
import { 
    RedeemCodeDto, 
    SubscriptionListFiltersDto, 
    SuspendSubscriptionDto, 
    ExtendSubscriptionDto, 
    ChangeSubscriptionPlanDto, 
    CancelSubscriptionDto 
} from '@/shared/dto/subscription.dto';

/**
 * Hook para consultar a subscrição da organização logada
 */
export const useMySubscription = () => {
    return useQuery({
        queryKey: ['subscription', 'me'],
        queryFn: () => subscriptionServices.getMySubscription(),
    });
};

/**
 * Hook para resgatar código de ativação
 */
export const useRedeemCode = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: RedeemCodeDto) => subscriptionServices.redeemCode(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription', 'me'] });
        },
    });
};

/**
 * 👨‍💼 SUPER ADMIN - Hook para listar todas as subscrições
 */
export const useSubscriptions = (params?: SubscriptionListFiltersDto) => {
    return useQuery({
        queryKey: ['subscriptions', params],
        queryFn: () => subscriptionServices.getAllSubscriptions(params),
    });
};

/**
 * 👨‍💼 SUPER ADMIN - Hook para pegar detalhes de uma subscrição
 */
export const useSubscription = (organizationId: string) => {
    return useQuery({
        queryKey: ['subscription', organizationId],
        queryFn: () => subscriptionServices.getSubscriptionByOrganizationId(organizationId),
        enabled: !!organizationId,
    });
};

/**
 * 👨‍💼 SUPER ADMIN - Hook para suspender subscrição
 */
export const useSuspendSubscription = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ organizationId, data }: { organizationId: string; data: SuspendSubscriptionDto }) =>
            subscriptionServices.suspendSubscription(organizationId, data),
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', organizationId] });
        },
    });
};

/**
 * 👨‍💼 SUPER ADMIN - Hook para reativar subscrição
 */
export const useResumeSubscription = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (organizationId: string) => subscriptionServices.resumeSubscription(organizationId),
        onSuccess: (_, organizationId) => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', organizationId] });
        },
    });
};

/**
 * 👨‍💼 SUPER ADMIN - Hook para estender subscrição
 */
export const useExtendSubscription = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ organizationId, data }: { organizationId: string; data: ExtendSubscriptionDto }) =>
            subscriptionServices.extendSubscription(organizationId, data),
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', organizationId] });
        },
    });
};

/**
 * 👨‍💼 SUPER ADMIN - Hook para marcar subscrição como expirada
 */
export const useExpireSubscription = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (organizationId: string) => subscriptionServices.expireSubscription(organizationId),
        onSuccess: (_, organizationId) => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', organizationId] });
        },
    });
};

/**
 * 👨‍💼 SUPER ADMIN - Hook para mudar plano de subscrição
 */
export const useChangeSubscriptionPlan = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ organizationId, data }: { organizationId: string; data: ChangeSubscriptionPlanDto }) =>
            subscriptionServices.changeSubscriptionPlan(organizationId, data),
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', organizationId] });
            queryClient.invalidateQueries({ queryKey: ['plans'] });
        },
    });
};

/**
 * 👨‍💼 SUPER ADMIN - Hook para cancelar subscrição
 */
export const useCancelSubscription = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ organizationId, data }: { organizationId: string; data: CancelSubscriptionDto }) =>
            subscriptionServices.cancelSubscription(organizationId, data),
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', organizationId] });
        },
    });
};
