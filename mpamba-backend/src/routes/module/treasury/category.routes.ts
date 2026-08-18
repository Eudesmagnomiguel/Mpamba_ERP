import { Router } from 'express';
import { categoryController } from '../../../controller/module/treasury/category.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => categoryController.getCategories(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_CREATE) as any,
	(req, res) => categoryController.createCategory(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_VIEW) as any,
	(req, res) => categoryController.getCategoryById(req as any, res)
);

router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_CREATE) as any,
	(req, res) => categoryController.updateCategory(req as any, res)
);

router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.TREASURY_ACCOUNT_CREATE) as any,
	(req, res) => categoryController.deleteCategory(req as any, res)
);

export default router;
