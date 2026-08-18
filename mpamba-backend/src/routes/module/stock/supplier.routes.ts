import { Router } from 'express';
import { supplierController } from '../../../controller/module/stock/supplier.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

/**
 * @swagger
 * /stock/suppliers:
 *   get:
 *     tags: [Stock Suppliers]
 *     summary: Lista todos os fornecedores
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: pageSize, schema: { type: integer } }
 *       - { in: query, name: search, schema: { type: string } }
 */
router.get(
	'/',
	permissionGuard(PERMISSIONS.STOCK_SUPPLIER_VIEW) as any,
	(req, res) => supplierController.getAllSuppliers(req as any, res)
);

/**
 * @swagger
 * /stock/suppliers/{id}:
 *   get:
 *     tags: [Stock Suppliers]
 *     summary: Busca fornecedor por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
router.get(
	'/:id',
	permissionGuard(PERMISSIONS.STOCK_SUPPLIER_VIEW) as any,
	(req, res) => supplierController.getSupplierById(req as any, res)
);

/**
 * @swagger
 * /stock/suppliers:
 *   post:
 *     tags: [Stock Suppliers]
 *     summary: Cria um novo fornecedor
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
 *               nif: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 */
router.post(
	'/',
	permissionGuard(PERMISSIONS.STOCK_SUPPLIER_CREATE) as any,
	(req, res) => supplierController.createSupplier(req as any, res)
);

/**
 * @swagger
 * /stock/suppliers/{id}:
 *   patch:
 *     tags: [Stock Suppliers]
 *     summary: Atualiza um fornecedor
 *     security: [{ bearerAuth: [] }]
 */
router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.STOCK_SUPPLIER_UPDATE) as any,
	(req, res) => supplierController.updateSupplier(req as any, res)
);

/**
 * @swagger
 * /stock/suppliers/{id}:
 *   delete:
 *     tags: [Stock Suppliers]
 *     summary: Remove ou desativa um fornecedor
 *     security: [{ bearerAuth: [] }]
 */
router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.STOCK_SUPPLIER_DELETE) as any,
	(req, res) => supplierController.deleteSupplier(req as any, res)
);

export default router;
