import { prisma } from '../../config/prisma.config.js';
import type { SendNotificationDto } from '../../shared/dto/notification.dto.js';

export class NotificationService {
	/**
	 * 👨‍💼 SUPER ADMIN - Envia uma notificação para todos, uma organização, ou um utilizador
	 */
	static async send(dto: SendNotificationDto, createdById: string) {
		if (dto.target === 'ORGANIZATION' && !dto.organizationId) {
			throw new Error('organizationId é obrigatório para o alvo ORGANIZATION');
		}
		if (dto.target === 'USER' && !dto.userId) {
			throw new Error('userId é obrigatório para o alvo USER');
		}

		let recipientIds: string[] = [];
		if (dto.target === 'ALL') {
			const users = await prisma.user.findMany({ select: { id: true } });
			recipientIds = users.map(u => u.id);
		} else if (dto.target === 'ORGANIZATION') {
			const users = await prisma.user.findMany({ where: { organizationId: dto.organizationId }, select: { id: true } });
			recipientIds = users.map(u => u.id);
		} else {
			recipientIds = [dto.userId as string];
		}

		return prisma.$transaction(async (tx) => {
			const notification = await tx.notification.create({
				data: {
					title: dto.title,
					message: dto.message,
					type: dto.type || 'INFO',
					target: dto.target,
					organizationId: dto.target === 'ORGANIZATION' ? dto.organizationId : null,
					userId: dto.target === 'USER' ? dto.userId : null,
					createdById
				}
			});

			if (recipientIds.length > 0) {
				await tx.notificationRecipient.createMany({
					data: recipientIds.map(userId => ({ notificationId: notification.id, userId })),
					skipDuplicates: true
				});
			}

			return notification;
		});
	}

	/**
	 * Notifica um único utilizador (uso interno, ex: eventos automáticos)
	 */
	static async notifyUser(userId: string, payload: { title: string; message: string; type?: SendNotificationDto['type'] }) {
		try {
			await prisma.$transaction(async (tx) => {
				const notification = await tx.notification.create({
					data: {
						title: payload.title,
						message: payload.message,
						type: payload.type || 'INFO',
						target: 'USER',
						userId
					}
				});
				await tx.notificationRecipient.create({ data: { notificationId: notification.id, userId } });
			});
		} catch (error) {
			console.error('[NotificationService] Falha ao notificar utilizador:', error);
		}
	}

	/**
	 * Notifica todos os utilizadores de uma organização (uso interno, ex: eventos automáticos)
	 */
	static async notifyOrganization(organizationId: string, payload: { title: string; message: string; type?: SendNotificationDto['type'] }) {
		try {
			const users = await prisma.user.findMany({ where: { organizationId }, select: { id: true } });
			if (users.length === 0) return;

			await prisma.$transaction(async (tx) => {
				const notification = await tx.notification.create({
					data: {
						title: payload.title,
						message: payload.message,
						type: payload.type || 'INFO',
						target: 'ORGANIZATION',
						organizationId
					}
				});
				await tx.notificationRecipient.createMany({
					data: users.map(u => ({ notificationId: notification.id, userId: u.id })),
					skipDuplicates: true
				});
			});
		} catch (error) {
			console.error('[NotificationService] Falha ao notificar organização:', error);
		}
	}

	static async listForUser(userId: string, page = 1, pageSize = 10) {
		const skip = (page - 1) * pageSize;

		const [recipients, total] = await Promise.all([
			prisma.notificationRecipient.findMany({
				where: { userId },
				include: { notification: true },
				orderBy: { notification: { createdAt: 'desc' } },
				skip,
				take: pageSize
			}),
			prisma.notificationRecipient.count({ where: { userId } })
		]);

		return {
			data: recipients.map(r => ({
				recipientId: r.id,
				id: r.notification.id,
				title: r.notification.title,
				message: r.notification.message,
				type: r.notification.type,
				createdAt: r.notification.createdAt,
				readAt: r.readAt
			})),
			pagination: {
				page,
				pageSize,
				total,
				totalPages: Math.ceil(total / pageSize)
			}
		};
	}

	static async getUnreadCount(userId: string) {
		return prisma.notificationRecipient.count({ where: { userId, readAt: null } });
	}

	static async markRead(recipientId: string, userId: string) {
		await prisma.notificationRecipient.updateMany({
			where: { id: recipientId, userId },
			data: { readAt: new Date() }
		});
	}

	static async markAllRead(userId: string) {
		await prisma.notificationRecipient.updateMany({
			where: { userId, readAt: null },
			data: { readAt: new Date() }
		});
	}
}
