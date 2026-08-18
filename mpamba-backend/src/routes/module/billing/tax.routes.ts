import { Router } from 'express';
import { taxController } from '../../../controller/module/billing/tax.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.BILLING_TAX_MANAGE) as any,
	(req, res) => taxController.listTaxRules(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.BILLING_TAX_MANAGE) as any,
	(req, res) => taxController.createTaxRule(req as any, res)
);

router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.BILLING_TAX_MANAGE) as any,
	(req, res) => taxController.updateTaxRule(req as any, res)
);

router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.BILLING_TAX_MANAGE) as any,
	(req, res) => taxController.deleteTaxRule(req as any, res)
);

export default router;
