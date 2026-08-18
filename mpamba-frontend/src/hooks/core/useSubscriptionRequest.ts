import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import subscriptionRequestService from '@/services/core/subscription-request.service';

export const useSubscriptionRequests = () => {
    return useQuery({
        queryKey: ['subscription-requests', 'me'],
        queryFn: () => subscriptionRequestService.getMyRequests(),
    });
};

export const useAllSubscriptionRequests = (status?: string) => {
    return useQuery({
        queryKey: ['subscription-requests', 'admin', status],
        queryFn: () => subscriptionRequestService.getAllRequests(status),
    });
};

export const useCreateSubscriptionRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { planId: string; type: 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE'; notes?: string; paymentReference?: string }) =>
            subscriptionRequestService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
        },
    });
};

export const useApproveSubscriptionRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, adminResponse }: { id: string; adminResponse?: string }) => 
            subscriptionRequestService.approve(id, adminResponse),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
        },
    });
};

export const useRejectSubscriptionRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, adminResponse }: { id: string; adminResponse: string }) => 
            subscriptionRequestService.reject(id, adminResponse),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
        },
    });
};
