import { Router } from 'express';
import { bankStatementController } from '../../../controller/module/treasury/bank-statement.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => bankStatementController.list(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_UPDATE) as any,
	(req, res) => bankStatementController.create(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => bankStatementController.getById(req as any, res)
);

router.get(
	'/:id/unmatched-movements',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => bankStatementController.unmatchedMovements(req as any, res)
);

router.post(
	'/:id/auto-match',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_UPDATE) as any,
	(req, res) => bankStatementController.autoMatch(req as any, res)
);

router.post(
	'/lines/:lineId/match',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_UPDATE) as any,
	(req, res) => bankStatementController.manualMatch(req as any, res)
);

router.post(
	'/lines/:lineId/unmatch',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_UPDATE) as any,
	(req, res) => bankStatementController.unmatch(req as any, res)
);

export default router;
