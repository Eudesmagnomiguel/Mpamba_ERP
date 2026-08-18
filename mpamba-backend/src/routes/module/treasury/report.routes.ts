import { Router } from 'express';
import { reportController } from '../../../controller/module/treasury/report.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

// Dashboard summary — used by the treasury main page
router.get(
	'/summary',
	permissionGuard(PERMISSIONS.TREASURY_REPORT_VIEW) as any,
	(req, res) => reportController.getSummary(req as any, res)
);

router.get(
	'/cash-flow',
	permissionGuard(PERMISSIONS.TREASURY_REPORT_VIEW) as any,
	(req, res) => reportController.getCashFlowReport(req as any, res)
);

router.get(
	'/category',
	permissionGuard(PERMISSIONS.TREASURY_REPORT_VIEW) as any,
	(req, res) => reportController.getCategoryReport(req as any, res)
);

// ── Exportação Excel (.xlsx) — mesmos dados e permissão dos endpoints acima ──

router.get(
	'/summary/export',
	permissionGuard(PERMISSIONS.TREASURY_REPORT_VIEW) as any,
	(req, res) => reportController.exportSummary(req as any, res)
);

router.get(
	'/cash-flow/export',
	permissionGuard(PERMISSIONS.TREASURY_REPORT_VIEW) as any,
	(req, res) => reportController.exportCashFlowReport(req as any, res)
);

router.get(
	'/category/export',
	permissionGuard(PERMISSIONS.TREASURY_REPORT_VIEW) as any,
	(req, res) => reportController.exportCategoryReport(req as any, res)
);

export default router;
