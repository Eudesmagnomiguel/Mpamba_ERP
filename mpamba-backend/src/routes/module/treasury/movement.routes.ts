import { Router } from 'express';
import { movementController } from '../../../controller/module/treasury/movement.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

// Endpoint único usado pelo frontend: o tipo (ENTRADA/SAIDA) vem no corpo.
router.post(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_TRANSACTION_CREATE) as any,
	(req, res) => movementController.createMovement(req as any, res)
);

router.post(
	'/income',
	permissionGuard(PERMISSIONS.TREASURY_TRANSACTION_CREATE) as any,
	(req, res) => movementController.addIncome(req as any, res)
);

router.post(
	'/expense',
	permissionGuard(PERMISSIONS.TREASURY_TRANSACTION_CREATE) as any,
	(req, res) => movementController.addExpense(req as any, res)
);

router.post(
	'/transfer',
	permissionGuard(PERMISSIONS.TREASURY_TRANSFER_CREATE) as any,
	(req, res) => movementController.transfer(req as any, res)
);

router.get(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => movementController.getMovements(req as any, res)
);

router.get(
	'/:id/verify',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => movementController.verifyIntegrity(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => movementController.getMovementById(req as any, res)
);

router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_TRANSACTION_DELETE) as any,
	(req, res) => movementController.deleteMovement(req as any, res)
);

export default router;
