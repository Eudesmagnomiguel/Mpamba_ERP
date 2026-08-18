import { Router } from 'express';
import { movementController } from '../../../controller/module/stock/movement.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

/**
 * @swagger
 * /stock/movements:
 *   get:
 *     tags: [Stock Movements]
 *     summary: Lista movimentos de stock
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: productId, schema: { type: string } }
 *       - { in: query, name: type, schema: { type: string, enum: [ENTRADA, SAIDA, AJUSTE] } }
 *       - { in: query, name: startDate, schema: { type: string, format: date-time } }
 *       - { in: query, name: endDate, schema: { type: string, format: date-time } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: pageSize, schema: { type: integer } }
 */
router.get(
	'/',
	permissionGuard(PERMISSIONS.STOCK_MOVEMENT_VIEW) as any,
	(req, res) => movementController.getMovements(req as any, res)
);

/**
 * @swagger
 * /stock/movements/products/{id}/add:
 *   post:
 *     tags: [Stock Movements]
 *     summary: Entrada de stock
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: number }
 *               reference: { type: string }
 *               reason: { type: string }
 *               supplierId: { type: string }
 */
router.post(
	'/products/:id/add',
	permissionGuard(PERMISSIONS.STOCK_ENTRY_CREATE) as any,
	(req, res) => movementController.addStock(req as any, res)
);

/**
 * @swagger
 * /stock/movements/products/{id}/remove:
 *   post:
 *     tags: [Stock Movements]
 *     summary: Saída de stock
 *     security: [{ bearerAuth: [] }]
 */
router.post(
	'/products/:id/remove',
	permissionGuard(PERMISSIONS.STOCK_EXIT_CREATE) as any,
	(req, res) => movementController.removeStock(req as any, res)
);

/**
 * @swagger
 * /stock/movements/products/{id}/adjust:
 *   post:
 *     tags: [Stock Movements]
 *     summary: Ajuste de stock
 *     description: Pode ser positivo ou negativo. Justificativa obrigatória.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity, reason]
 *             properties:
 *               quantity: { type: number, description: "Positivo=soma, Negativo=subtrai" }
 *               reason: { type: string, minLength: 5 }
 *               reference: { type: string }
 */
router.post(
	'/products/:id/adjust',
	permissionGuard(PERMISSIONS.STOCK_ADJUSTMENT_CREATE) as any,
	(req, res) => movementController.adjustStock(req as any, res)
);

/**
 * @swagger
 * /stock/movements/{id}/reverse:
 *   post:
 *     tags: [Stock Movements]
 *     summary: Reversão de movimento
 *     description: |
 *       Cria um movimento inverso para compensar um erro.
 *       NUNCA apaga o histórico original.
 *       Justificativa obrigatória.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, minLength: 5 }
 */
router.post(
	'/:id/reverse',
	permissionGuard(PERMISSIONS.STOCK_MOVEMENT_CREATE) as any,
	(req, res) => movementController.reverseMovement(req as any, res)
);

export default router;
