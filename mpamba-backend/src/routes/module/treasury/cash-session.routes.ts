import { Router } from 'express';
import { cashSessionController } from '../../../controller/module/treasury/cash-session.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => cashSessionController.list(req as any, res)
);

router.post(
	'/open',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_UPDATE) as any,
	(req, res) => cashSessionController.open(req as any, res)
);

router.post(
	'/:id/close',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_UPDATE) as any,
	(req, res) => cashSessionController.close(req as any, res)
);

router.get(
	'/active/:accountId',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => cashSessionController.getActive(req as any, res)
);

export default router;
