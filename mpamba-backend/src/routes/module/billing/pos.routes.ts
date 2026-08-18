import { Router } from 'express';
import { PosController } from '../../../controller/module/billing/pos.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

/**
 * @swagger
 * /billing/pos/checkout:
 *   post:
 *     tags:
 *       - POS
 *     summary: Finaliza uma venda de balcão (Posto de Venda)
 *     description: Cria uma fatura emitida + recibo pago a partir do carrinho, e dá baixa automática no stock dos produtos vendidos.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentMethod, items]
 *             properties:
 *               customerId:
 *                 type: string
 *               customerName:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, MULTICAIXA, TRANSFER, DEPOSIT]
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       201:
 *         description: Venda concluída com sucesso
 *       400:
 *         description: Dados inválidos ou estoque insuficiente
 */
router.post(
	'/checkout',
	permissionGuard(PERMISSIONS.BILLING_POS_MANAGE) as any,
	(req, res) => PosController.checkout(req as any, res)
);

export default router;
