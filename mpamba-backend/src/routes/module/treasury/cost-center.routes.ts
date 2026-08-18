import { Router } from 'express';
import { costCenterController } from '../../../controller/module/treasury/cost-center.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_CATEGORY_VIEW) as any,
	(req, res) => costCenterController.getCostCenters(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_CATEGORY_VIEW) as any,
	(req, res) => costCenterController.getCostCenterById(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_CATEGORY_CREATE) as any,
	(req, res) => costCenterController.createCostCenter(req as any, res)
);

router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_CATEGORY_UPDATE) as any,
	(req, res) => costCenterController.updateCostCenter(req as any, res)
);

router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_CATEGORY_DELETE) as any,
	(req, res) => costCenterController.deleteCostCenter(req as any, res)
);

export default router;
