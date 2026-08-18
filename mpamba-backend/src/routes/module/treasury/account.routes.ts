import { Router } from 'express';
import { accountController } from '../../../controller/module/treasury/account.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => accountController.getAccounts(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_CREATE) as any,
	(req, res) => accountController.createAccount(req as any, res)
);

router.get(
	'/:id/balance',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => accountController.getBalance(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => accountController.getAccountById(req as any, res)
);

router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_UPDATE) as any,
	(req, res) => accountController.updateAccount(req as any, res)
);

router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_DELETE) as any,
	(req, res) => accountController.deleteAccount(req as any, res)
);

export default router;
