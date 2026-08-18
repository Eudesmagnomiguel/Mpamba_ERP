/**
 * @fileoverview Rotas de permissões
 * @description Define todos os endpoints para gerenciar permissões do sistema
 */

import { Router } from "express";
import { permissionController } from "../../controller/core/permission.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { cacheMiddleware, clearCacheMiddleware } from "../../middleware/cache.middleware.js";
import { permissionGuard } from "../../shared/utils/rbac/permission.guard.js";
import { PERMISSIONS } from "../../shared/utils/rbac/permission.constants.js";

const router = Router();

router.use(authMiddleware as any);

/**
 * @swagger
 * /permissions:
 *   get:
 *     tags:
 *       - Permissions
 *     summary: Lista todas as permissões
 *     description: Retorna uma lista paginada de todas as permissões do sistema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de itens por página
 *     responses:
 *       200:
 *         description: Lista de permissões retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       code:
 *                         type: string
 *                       description:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/",
	cacheMiddleware(600, 'permissions:'),
	permissionGuard(PERMISSIONS.ROLE_VIEW),
	permissionController.getAll
);

/**
 * @swagger
 * /permissions:
 *   post:
 *     tags:
 *       - Permissions
 *     summary: Cria uma nova permissão
 *     description: Cria uma nova permissão no sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 example: "permission:view"
 *                 description: Código único da permissão
 *               description:
 *                 type: string
 *                 example: "Visualizar permissões"
 *                 description: Descrição da permissão
 *     responses:
 *       201:
 *         description: Permissão criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 code:
 *                   type: string
 *                 description:
 *                   type: string
 *       400:
 *         description: Dados de entrada inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/",
	clearCacheMiddleware('permissions:'),
	permissionGuard(PERMISSIONS.ROLE_CREATE),
	permissionController.create
);

router.put('/:id',
    clearCacheMiddleware('permissions:'),
    permissionGuard(PERMISSIONS.ROLE_UPDATE),
    permissionController.update
);

export default router;