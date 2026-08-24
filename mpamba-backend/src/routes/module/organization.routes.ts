import { Router } from "express";
import { organizationController } from "../../controller/module/organization.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { permissionGuard } from "../../shared/utils/rbac/permission.guard.js";
import { PERMISSIONS } from "../../shared/utils/rbac/permission.constants.js";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * /organization:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Lista todas as organizações
 *     description: Retorna uma lista paginada de organizações com seus módulos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - name: pageSize
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de registros por página
 *     responses:
 *       200:
 *         description: Lista de organizações com paginação
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
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       nif:
 *                         type: string
 *                       email:
 *                         type: string
 *                       address:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       modules:
 *                         type: array
 *                         items:
 *                           type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
 */
/**
 * @swagger
 * /organization/me:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Dados da própria organização (parametrização)
 *     security:
 *       - bearerAuth: []
 */
router.get(
	"/me",
	permissionGuard(PERMISSIONS.SETTING_VIEW),
	organizationController.getMine.bind(organizationController)
);

/**
 * @swagger
 * /organization/me:
 *   put:
 *     tags:
 *       - Organization
 *     summary: Atualiza os dados da própria organização (parametrização)
 *     description: Permite ao admin da organização atualizar nome, NIF, morada, telefone e email. Não permite alterar plano ou estado de ativação.
 *     security:
 *       - bearerAuth: []
 */
router.put(
	"/me",
	permissionGuard(PERMISSIONS.SETTING_UPDATE),
	organizationController.updateMine.bind(organizationController)
);

/**
 * @swagger
 * /organizations/me/logo:
 *   put:
 *     tags:
 *       - Organization
 *     summary: Define o logótipo impresso na factura
 *     description: Aceita um URL http(s) ou a imagem em data URI (PNG, JPG, GIF ou WebP, até cerca de 1 MB).
 *     security:
 *       - bearerAuth: []
 */
router.put(
	"/me/logo",
	permissionGuard(PERMISSIONS.SETTING_UPDATE),
	organizationController.updateMineLogo.bind(organizationController)
);

router.get("/", organizationController.getAll.bind(organizationController));

/**
 * @swagger
 * /organization/{id}:
 *   get:
 *     tags:
 *       - Organization
 *     summary: Busca uma organização por ID
 *     description: Retorna os dados completos de uma organização incluindo módulos e usuários
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização
 *     responses:
 *       200:
 *         description: Dados da organização com detalhes completos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 nif:
 *                   type: string
 *                 email:
 *                   type: string
 *                 address:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 modules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       moduleId:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       module:
 *                         type: object
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Organização não encontrada
 */
router.get("/:id", organizationController.getById.bind(organizationController));

/**
 * @swagger
 * /organization:
 *   post:
 *     tags:
 *       - Organization
 *     summary: Cria uma nova organização
 *     description: Cria uma nova organização com dados básicos
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
 *                 description: Nome da organização
 *               nif:
 *                 type: string
 *                 description: Número de Identificação Fiscal
 *               address:
 *                 type: string
 *                 description: Endereço da organização
 *               phone:
 *                 type: string
 *                 description: Telefone de contato
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de contato
 *               planId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do plano (opcional)
 *               isActive:
 *                 type: boolean
 *                 description: Status de ativação
 *           example:
 *             name: "Tech Solutions Ltd"
 *             nif: "123456789"
 *             address: "Rua Principal, 123"
 *             phone: "+351 21 1234567"
 *             email: "contact@techsolutions.com"
 *             planId: "550e8400-e29b-41d4-a716-446655440000"
 *             isActive: true
 *     responses:
 *       201:
 *         description: Organização criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 nif:
 *                   type: string
 *                 address:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 email:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem permissão
 */
router.post(
	"/",
	permissionGuard(PERMISSIONS.ORGANIZATION_CREATE),
	organizationController.create.bind(organizationController)
);

/**
 * @swagger
 * /organization/{id}:
 *   put:
 *     tags:
 *       - Organization
 *     summary: Atualiza uma organização
 *     description: Atualiza os dados de uma organização existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização a atualizar
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
 *                 description: Nome da organização
 *                 example: "Tech Solutions Ltd Updated"
 *               nif:
 *                 type: string
 *                 description: Número de Identificação Fiscal
 *                 example: "123456789"
 *               address:
 *                 type: string
 *                 description: Endereço
 *                 example: "Rua Nova, 456"
 *               phone:
 *                 type: string
 *                 description: Telefone
 *                 example: "+351 21 9876543"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email
 *                 example: "newemail@techsolutions.com"
 *               planId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do novo plano
 *               isActive:
 *                 type: boolean
 *                 description: Status de ativação
 *     responses:
 *       200:
 *         description: Organização atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Organização não encontrada
 */
router.put(
	"/:id",
	permissionGuard(PERMISSIONS.ORGANIZATION_UPDATE),
	organizationController.update.bind(organizationController)
);

/**
 * @swagger
 * /organization/{id}:
 *   delete:
 *     tags:
 *       - Organization
 *     summary: Deleta uma organização
 *     description: Remove uma organização do sistema (status 204 No Content)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização a deletar
 *     responses:
 *       204:
 *         description: Organização deletada com sucesso (sem conteúdo)
 *       400:
 *         description: Não é possível deletar (com usuários ou dependências)
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Organização não encontrada
 */
router.delete(
	"/:id",
	permissionGuard(PERMISSIONS.ORGANIZATION_DELETE),
	organizationController.delete.bind(organizationController)
);

/**
 * @swagger
 * /organization/{id}/modules/{moduleId}:
 *   post:
 *     tags:
 *       - Organization
 *     summary: Atribui um módulo à organização
 *     description: Ativa e vincula um módulo a uma organização
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização
 *       - name: moduleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do módulo a atribuir
 *     responses:
 *       201:
 *         description: Módulo atribuído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 organizationId:
 *                   type: string
 *                 moduleId:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *       400:
 *         description: Módulo já atribuído ou dados inválidos
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Organização ou módulo não encontrado
 */
router.post(
	"/:id/modules/:moduleId",
	permissionGuard(PERMISSIONS.ORGANIZATION_UPDATE),
	organizationController.assignModule.bind(organizationController)
);

/**
 * @swagger
 * /organization/{id}/modules/{moduleId}:
 *   delete:
 *     tags:
 *       - Organization
 *     summary: Remove um módulo da organização
 *     description: Desativa e desvincula um módulo de uma organização (status 204 No Content)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização
 *       - name: moduleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do módulo a remover
 *     responses:
 *       204:
 *         description: Módulo removido com sucesso (sem conteúdo)
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Organização ou módulo não encontrado
 */
router.delete(
	"/:id/modules/:moduleId",
	permissionGuard(PERMISSIONS.ORGANIZATION_UPDATE),
	organizationController.removeModule.bind(organizationController)
);

export default router;