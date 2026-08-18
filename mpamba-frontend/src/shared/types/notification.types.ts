export type NotificationTypeValue = 'INFO' | 'SUCCESS' | 'WARNING' | 'SYSTEM';
export type NotificationTargetValue = 'ALL' | 'ORGANIZATION' | 'USER';

export interface AppNotification {
	recipientId: string;
	id: string;
	title: string;
	message: string;
	type: NotificationTypeValue;
	createdAt: string;
	readAt: string | null;
}

export interface CreateNotificationDto {
	title: string;
	message: string;
	type?: NotificationTypeValue;
	target: NotificationTargetValue;
	organizationId?: string;
	userId?: string;
}
