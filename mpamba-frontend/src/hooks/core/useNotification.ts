import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '@/services/core/notification.services';
import { CreateNotificationDto } from '@/shared/types/notification.types';

export const useNotifications = (params?: { page?: number; pageSize?: number }) => {
	return useQuery({
		queryKey: ['notifications', params],
		queryFn: () => notificationService.list(params),
	});
};

export const useUnreadNotificationCount = () => {
	return useQuery({
		queryKey: ['notifications-unread-count'],
		queryFn: () => notificationService.unreadCount(),
		refetchInterval: 30000,
		refetchOnWindowFocus: true,
	});
};

export const useMarkNotificationRead = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => notificationService.markRead(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
			queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
		},
	});
};

export const useMarkAllNotificationsRead = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => notificationService.markAllRead(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
			queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
		},
	});
};

export const useSendNotification = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateNotificationDto) => notificationService.send(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});
};
