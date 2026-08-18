import { Router } from 'express';
import { statsController } from '../../../controller/module/billing/stats.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.INVOICE_VIEW) as any,
	(req, res) => statsController.getStats(req as any, res)
);

export default router;
