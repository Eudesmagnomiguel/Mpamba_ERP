import { Router } from 'express';
import { categoryController } from '../../../controller/module/stock/category.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

/**
 * @swagger
 * /stock/categories:
 *   get:
 *     tags: [Stock Categories]
 *     summary: Lista todas as categorias de produtos
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: pageSize, schema: { type: integer } }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses:
 *       200: { description: Lista de categorias }
 */
router.get(
	'/',
	permissionGuard(PERMISSIONS.STOCK_CATEGORY_VIEW) as any,
	(req, res) => categoryController.getAllCategories(req as any, res)
);

/**
 * @swagger
 * /stock/categories/{id}:
 *   get:
 *     tags: [Stock Categories]
 *     summary: Busca categoria por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
router.get(
	'/:id',
	permissionGuard(PERMISSIONS.STOCK_CATEGORY_VIEW) as any,
	(req, res) => categoryController.getCategoryById(req as any, res)
);

/**
 * @swagger
 * /stock/categories:
 *   post:
 *     tags: [Stock Categories]
 *     summary: Cria uma nova categoria
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 */
router.post(
	'/',
	permissionGuard(PERMISSIONS.STOCK_CATEGORY_CREATE) as any,
	(req, res) => categoryController.createCategory(req as any, res)
);

/**
 * @swagger
 * /stock/categories/{id}:
 *   patch:
 *     tags: [Stock Categories]
 *     summary: Atualiza uma categoria
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.STOCK_CATEGORY_UPDATE) as any,
	(req, res) => categoryController.updateCategory(req as any, res)
);

/**
 * @swagger
 * /stock/categories/{id}:
 *   delete:
 *     tags: [Stock Categories]
 *     summary: Remove uma categoria
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.STOCK_CATEGORY_DELETE) as any,
	(req, res) => categoryController.deleteCategory(req as any, res)
);

export default router;
