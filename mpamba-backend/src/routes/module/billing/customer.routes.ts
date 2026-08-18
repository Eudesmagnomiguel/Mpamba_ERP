import { Router } from 'express';
import { customerController } from '../../../controller/module/billing/customer.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.INVOICE_VIEW) as any,
	(req, res) => customerController.list(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.INVOICE_VIEW) as any,
	(req, res) => customerController.getById(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.INVOICE_CREATE) as any,
	(req, res) => customerController.create(req as any, res)
);

router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.INVOICE_UPDATE) as any,
	(req, res) => customerController.update(req as any, res)
);

router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.INVOICE_CANCEL) as any,
	(req, res) => customerController.delete(req as any, res)
);

export default router;
