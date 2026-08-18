import { Router } from 'express';
import { productController } from '../../../controller/module/stock/product.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

/**
 * @swagger
 * /stock/summary:
 *   get:
 *     tags: [Stock]
 *     summary: Resumo geral do stock
 *     security: [{ bearerAuth: [] }]
 */
router.get(
	'/summary',
	permissionGuard(PERMISSIONS.STOCK_PRODUCT_VIEW) as any,
	(req, res) => productController.getSummary(req as any, res)
);

/**
 * @swagger
 * /stock/insights/most-used:
 *   get:
 *     tags: [Stock]
 *     summary: Produtos com maior volume de saídas
 *     security: [{ bearerAuth: [] }]
 */
router.get(
	'/insights/most-used',
	permissionGuard(PERMISSIONS.STOCK_PRODUCT_VIEW) as any,
	(req, res) => productController.getMostUsedProducts(req as any, res)
);

/**
 * @swagger
 * /stock/report/export:
 *   get:
 *     tags: [Stock]
 *     summary: Exporta o relatório de inventário em CSV
 *     security: [{ bearerAuth: [] }]
 */
router.get(
	'/report/export',
	permissionGuard(PERMISSIONS.STOCK_PRODUCT_VIEW) as any,
	(req, res) => productController.exportReport(req as any, res)
);

/**
 * @swagger
 * /stock/report/export/excel:
 *   get:
 *     tags: [Stock]
 *     summary: Exporta o relatório de inventário em Excel (.xlsx)
 *     security: [{ bearerAuth: [] }]
 */
router.get(
	'/report/export/excel',
	permissionGuard(PERMISSIONS.STOCK_PRODUCT_VIEW) as any,
	(req, res) => productController.exportReportExcel(req as any, res)
);

export default router;
