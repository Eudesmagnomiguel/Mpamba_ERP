import { Router } from 'express';
import { serviceController } from '../../../controller/module/billing/service.controller.js';
import { billingExportController } from '../../../controller/module/billing/export.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.INVOICE_CREATE) as any,
	(req, res) => serviceController.listServices(req as any, res)
);

// Antes de '/:id', senão 'export' seria interpretado como um id de serviço.
router.get(
	'/export',
	permissionGuard(PERMISSIONS.INVOICE_CREATE) as any,
	(req, res) => billingExportController.exportServices(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.INVOICE_CREATE) as any,
	(req, res) => serviceController.getServiceById(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.INVOICE_CREATE) as any,
	(req, res) => serviceController.createService(req as any, res)
);

router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.INVOICE_CREATE) as any,
	(req, res) => serviceController.updateService(req as any, res)
);

router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.INVOICE_CREATE) as any,
	(req, res) => serviceController.deleteService(req as any, res)
);

export default router;
