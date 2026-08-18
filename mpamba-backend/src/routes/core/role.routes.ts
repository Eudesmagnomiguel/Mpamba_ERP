/**
 * @fileoverview Rotas de perfis (roles)
 * @description Define todos os endpoints para gerenciar perfis e permissões do sistema
 */

import { Router } from "express";
import { roleController } from "../../controller/core/role.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { permissionGuard } from "../../shared/utils/rbac/permission.guard.js";
import { PERMISSIONS } from "../../shared/utils/rbac/permission.constants.js";

const router = Router();

router.use(authMiddleware as any);

/**
 * @swagger
 * /roles:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Lista todos os perfis
 *     description: Retorna uma lista paginada de todos os perfis (roles) do sistema
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
 *         description: Lista de perfis retornada com sucesso
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       organizationId:
 *                         type: string
 *                       permissions:
 *                         type: array
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/",
	permissionGuard(PERMISSIONS.ROLE_VIEW),
	roleController.getAll
);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Obtém um perfil por ID
 *     description: Retorna os detalhes de um perfil específico incluindo suas permissões
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do perfil
 *     responses:
 *       200:
 *         description: Perfil retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 organizationId:
 *                   type: string
 *                 permissions:
 *                   type: array
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Perfil não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/:id",
	permissionGuard(PERMISSIONS.ROLE_VIEW),
	roleController.getById
);

/**
 * @swagger
 * /roles/module/{moduleCode}:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Lista perfis de um módulo específico
 *     description: Retorna uma lista paginada de perfis que possuem permissões do módulo especificado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do módulo (ex. user, organization, etc)
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
 *         description: Lista de perfis do módulo retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       400:
 *         description: Código do módulo é obrigatório
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/module/:moduleCode",
	permissionGuard(PERMISSIONS.ROLE_VIEW),
	roleController.getByModule
);

/**
 * @swagger
 * /roles:
 *   post:
 *     tags:
 *       - Roles
 *     summary: Cria um novo perfil
 *     description: Cria um novo perfil (role) no sistema com permissões associadas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "Gerenciador"
 *                 description: Nome único do perfil
 *               description:
 *                 type: string
 *                 example: "Perfil com permissões de gerenciamento"
 *                 description: Descrição do perfil
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs das permissões associadas ao perfil
 *     responses:
 *       201:
 *         description: Perfil criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 organizationId:
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
	permissionGuard(PERMISSIONS.ROLE_CREATE),
	roleController.create
);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     tags:
 *       - Roles
 *     summary: Atualiza um perfil existente
 *     description: Atualiza os dados e permissões de um perfil existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do perfil a atualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 description: Novo nome do perfil
 *               description:
 *                 type: string
 *                 description: Nova descrição do perfil
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Novos IDs de permissões
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Dados de entrada inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Perfil não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put("/:id",
	permissionGuard(PERMISSIONS.ROLE_UPDATE),
	roleController.update
);

// Attach a permission to a role
router.post('/:id/permissions',
	permissionGuard(PERMISSIONS.ROLE_PERMISSION_UPDATE),
	roleController.attachPermission
);

// Detach a permission from a role
router.delete('/:id/permissions/:permissionId',
	permissionGuard(PERMISSIONS.ROLE_PERMISSION_UPDATE),
	roleController.detachPermission
);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     tags:
 *       - Roles
 *     summary: Remove um perfil
 *     description: Deleta um perfil do sistema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do perfil a remover
 *     responses:
 *       204:
 *         description: Perfil removido com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão insuficiente
 *       404:
 *         description: Perfil não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete("/:id",
	permissionGuard(PERMISSIONS.ROLE_DELETE),
	roleController.delete
);

export default router;
