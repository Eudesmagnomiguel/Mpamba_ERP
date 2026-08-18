export type NotificationTargetDto = 'ALL' | 'ORGANIZATION' | 'USER';
export type NotificationTypeDto = 'INFO' | 'SUCCESS' | 'WARNING' | 'SYSTEM';

export interface SendNotificationDto {
	title: string;
	message: string;
	type?: NotificationTypeDto;
	target: NotificationTargetDto;
	organizationId?: string;
	userId?: string;
}

export interface ListNotificationsQueryDto {
	page?: number;
	pageSize?: number;
}
