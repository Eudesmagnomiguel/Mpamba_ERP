import { Router } from 'express';
import { productController } from '../../../controller/module/stock/product.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

/**
 * @swagger
 * /stock/products:
 *   get:
 *     tags: [Stock Products]
 *     summary: Lista todos os produtos
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: pageSize, schema: { type: integer } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: categoryId, schema: { type: string } }
 */
router.get(
	'/',
	permissionGuard(PERMISSIONS.STOCK_PRODUCT_VIEW) as any,
	(req, res) => productController.getAllProducts(req as any, res)
);

/**
 * @swagger
 * /stock/products/{id}:
 *   get:
 *     tags: [Stock Products]
 *     summary: Busca produto por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
router.get(
	'/:id',
	permissionGuard(PERMISSIONS.STOCK_PRODUCT_VIEW) as any,
	(req, res) => productController.getProductById(req as any, res)
);

/**
 * @swagger
 * /stock/products:
 *   post:
 *     tags: [Stock Products]
 *     summary: Cria um novo produto
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, sku, unit]
 *             properties:
 *               name: { type: string }
 *               sku: { type: string }
 *               unit: { type: string }
 *               categoryId: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               minStock: { type: number }
 */
router.post(
	'/',
	permissionGuard(PERMISSIONS.STOCK_PRODUCT_CREATE) as any,
	(req, res) => productController.createProduct(req as any, res)
);

/**
 * @swagger
 * /stock/products/{id}:
 *   patch:
 *     tags: [Stock Products]
 *     summary: Atualiza um produto
 *     security: [{ bearerAuth: [] }]
 */
router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.STOCK_PRODUCT_UPDATE) as any,
	(req, res) => productController.updateProduct(req as any, res)
);

/**
 * @swagger
 * /stock/products/{id}:
 *   delete:
 *     tags: [Stock Products]
 *     summary: Remove ou desativa um produto
 *     security: [{ bearerAuth: [] }]
 */
router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.STOCK_PRODUCT_DELETE) as any,
	(req, res) => productController.deleteProduct(req as any, res)
);

export default router;
