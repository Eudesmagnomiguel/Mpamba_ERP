/**
 * @fileoverview Rotas de notificações
 */

import { Router } from 'express';
import { NotificationController } from '../../controller/core/notification.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { permissionGuard } from '../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.use(authMiddleware as any);

/**
 * @swagger
 * /notifications/me:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Lista as notificações do utilizador autenticado
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', (req, res) => NotificationController.listMine(req as any, res));

/**
 * @swagger
 * /notifications/me/unread-count:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Contagem de notificações não lidas do utilizador autenticado
 *     security:
 *       - bearerAuth: []
 */
router.get('/me/unread-count', (req, res) => NotificationController.unreadCount(req as any, res));

/**
 * @swagger
 * /notifications/me/{id}/read:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Marca uma notificação como lida
 *     security:
 *       - bearerAuth: []
 */
router.post('/me/:id/read', (req, res) => NotificationController.markRead(req as any, res));

/**
 * @swagger
 * /notifications/me/read-all:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Marca todas as notificações do utilizador como lidas
 *     security:
 *       - bearerAuth: []
 */
router.post('/me/read-all', (req, res) => NotificationController.markAllRead(req as any, res));

/**
 * @swagger
 * /notifications:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Envia uma notificação (Super Admin)
 *     description: Envia para todos, uma organização, ou um utilizador específico.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message, target]
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [INFO, SUCCESS, WARNING, SYSTEM]
 *               target:
 *                 type: string
 *                 enum: [ALL, ORGANIZATION, USER]
 *               organizationId:
 *                 type: string
 *               userId:
 *                 type: string
 */
router.post('/', permissionGuard(PERMISSIONS.NOTIFICATION_SEND) as any, (req, res) => NotificationController.send(req as any, res));

export default router;
