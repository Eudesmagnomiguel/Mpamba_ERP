import { Router } from 'express';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';
import { seriesController } from '../../../controller/module/billing/series.controller.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.BILLING_SERIES_MANAGE) as any,
	(req, res) => seriesController.getSeries(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.BILLING_SERIES_MANAGE) as any,
	(req, res) => seriesController.createSeries(req as any, res)
);

export default router;
