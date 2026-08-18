import { Router } from 'express';
import { receivableController } from '../../../controller/module/treasury/receivable.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_TRANSACTION_VIEW) as any,
	(req, res) => receivableController.getReceivables(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_TRANSACTION_CREATE) as any,
	(req, res) => receivableController.createReceivable(req as any, res)
);

router.post(
	'/:id/pay',
	permissionGuard(PERMISSIONS.TREASURY_TRANSACTION_UPDATE) as any,
	(req, res) => receivableController.markAsPaid(req as any, res)
);

router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_TRANSACTION_DELETE) as any,
	(req, res) => receivableController.deleteReceivable(req as any, res)
);

export default router;
