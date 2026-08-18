import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import { NotificationService } from '../../services/core/notification.service.js';

export class NotificationController {
	static async listMine(req: AuthRequest, res: Response) {
		try {
			const userId = req.user!.sub;
			const page = parseInt(req.query.page as string) || 1;
			const pageSize = parseInt(req.query.pageSize as string) || 10;
			const result = await NotificationService.listForUser(userId, page, pageSize);
			return res.json(result);
		} catch (error: any) {
			return res.status(500).json({ message: error.message || 'Erro ao listar notificações' });
		}
	}

	static async unreadCount(req: AuthRequest, res: Response) {
		try {
			const userId = req.user!.sub;
			const count = await NotificationService.getUnreadCount(userId);
			return res.json({ count });
		} catch (error: any) {
			return res.status(500).json({ message: error.message || 'Erro ao obter contagem de não lidas' });
		}
	}

	static async markRead(req: AuthRequest, res: Response) {
		try {
			const userId = req.user!.sub;
			const { id } = req.params;
			await NotificationService.markRead(id as string, userId);
			return res.json({ message: 'Notificação marcada como lida' });
		} catch (error: any) {
			return res.status(500).json({ message: error.message || 'Erro ao marcar notificação como lida' });
		}
	}

	static async markAllRead(req: AuthRequest, res: Response) {
		try {
			const userId = req.user!.sub;
			await NotificationService.markAllRead(userId);
			return res.json({ message: 'Todas as notificações foram marcadas como lidas' });
		} catch (error: any) {
			return res.status(500).json({ message: error.message || 'Erro ao marcar todas como lidas' });
		}
	}

	static async send(req: AuthRequest, res: Response) {
		try {
			const createdById = req.user!.sub;
			const notification = await NotificationService.send(req.body, createdById);
			return res.status(201).json({ data: notification });
		} catch (error: any) {
			return res.status(400).json({ message: error.message || 'Erro ao enviar notificação' });
		}
	}
}
