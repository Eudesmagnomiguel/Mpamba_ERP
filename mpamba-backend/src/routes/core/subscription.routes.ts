import { Router } from 'express';
import { subscriptionController } from '../../controller/core/subscription.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { permissionGuard } from '../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.use(authMiddleware as any);

/**
 * @swagger
 * /subscription/me:
 *   get:
 *     tags: [Subscription - User]
 *     summary: Consulta o estado da subscrição da minha organização
 *     description: Retorna informações detalhadas sobre a subscrição ativa da organização do utilizador autenticado, incluindo status, plano, datas de validade e módulos ativos.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado da subscrição obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: boolean
 *                       description: Se a subscrição está ativa
 *                       example: true
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, SUSPENDED, EXPIRED, TRIAL, NONE]
 *                       example: ACTIVE
 *                     message:
 *                       type: string
 *                       example: Subscrição ativa
 *                     plan:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                           example: Professional
 *                         price:
 *                           type: number
 *                           example: 99.99
 *       401:
 *         description: Token inválido ou não autenticado
 *       403:
 *         description: Organização não identificada
 *       500:
 *         description: Erro ao consultar subscrição
 */
router.get('/me', (req, res) => subscriptionController.getMySubscription(req as any, res));

/**
 * @swagger
 * /subscription/redeem:
 *   post:
 *     tags: [Subscription - User]
 *     summary: Resgata um código de ativação para upgrade/renovação de plano
 *     description: Permite que o administrador de uma organização resgate um código de ativação para fazer upgrade, downgrade ou renovar o seu plano. O código ativa imediatamente o novo plano e provisiona os módulos correspondentes.
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
 *                 description: Código de ativação (8 caracteres alfanuméricos)
 *                 example: "ABCD1234"
 *           examples:
 *             valid_code:
 *               value:
 *                 code: "ABCD1234"
 *     responses:
 *       200:
 *         description: Código resgatado com sucesso e plano atualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sucesso! Seu plano foi atualizado para Professional."
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       type: object
 *                     plan:
 *                       type: string
 *       400:
 *         description: Código inválido, expirado ou já utilizado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Apenas administradores podem resgatar códigos
 *       500:
 *         description: Erro ao processar código
 */
router.post('/redeem', (req, res) => subscriptionController.redeemCode(req as any, res));

/**
 * @swagger
 * /subscription/admin:
 *   get:
 *     tags: [Subscription - Admin]
 *     summary: Lista todas as subscrições com filtros e paginação
 *     description: Endpoint exclusivo para Super Admin. Lista todas as subscrições de todas as organizações com suporte a filtros avançados (status, nome da organização) e paginação.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página (começa em 1)
 *         example: 1
 *       - name: pageSize
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de registos por página
 *         example: 10
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, CANCELLED, PAST_DUE, TRIAL]
 *         description: Filtrar por status da subscrição
 *         example: ACTIVE
 *       - name: organizationName
 *         in: query
 *         schema:
 *           type: string
 *         description: Filtrar por nome da organização (busca parcial, case-insensitive)
 *         example: "Mpamba"
 *     responses:
 *       200:
 *         description: Lista de subscrições obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       organizationId:
 *                         type: string
 *                         format: uuid
 *                       organization:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       planId:
 *                         type: string
 *                         format: uuid
 *                       plan:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                       status:
 *                         type: string
 *                         enum: [ACTIVE, SUSPENDED, CANCELLED, PAST_DUE, TRIAL]
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 45
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Token inválido ou não autenticado
 *       403:
 *         description: Sem permissão (requer PLAN_VIEW)
 *       500:
 *         description: Erro ao listar subscrições
 */
router.get('/admin', permissionGuard(PERMISSIONS.PLAN_VIEW), (req, res) => subscriptionController.getAllSubscriptions(req as any, res));

/**
 * @swagger
 * /subscription/admin/{organizationId}:
 *   get:
 *     tags: [Subscription - Admin]
 *     summary: Consulta subscrição de uma organização específica
 *     description: Obtém informações completas da subscrição de uma organização, incluindo detalhes do plano, módulos associados e datas de validade.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: organizationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único da organização
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Subscrição obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     organizationId:
 *                       type: string
 *                       format: uuid
 *                     organization:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                     plan:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         code:
 *                           type: string
 *                         price:
 *                           type: number
 *                         modules:
 *                           type: array
 *                           items:
 *                             type: object
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, SUSPENDED, CANCELLED, PAST_DUE, TRIAL]
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Token inválido ou não autenticado
 *       403:
 *         description: Sem permissão (requer PLAN_VIEW)
 *       404:
 *         description: Subscrição não encontrada para esta organização
 *       500:
 *         description: Erro ao consultar subscrição
 */
router.get('/admin/:organizationId', permissionGuard(PERMISSIONS.PLAN_VIEW), (req, res) => subscriptionController.getSubscriptionByOrganizationId(req as any, res));

/**
 * @swagger
 * /subscription/admin/{organizationId}/suspend:
 *   post:
 *     tags: [Subscription - Admin]
 *     summary: Suspende a subscrição de uma organização
 *     description: Suspende a subscrição de uma organização, bloqueando seu acesso à plataforma. Útil para casos de falta de pagamento ou violação de termos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: organizationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único da organização
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Motivo da suspensão (opcional)
 *                 example: "Falta de pagamento"
 *           examples:
 *             with_reason:
 *               value:
 *                 reason: "Falta de pagamento"
 *             without_reason:
 *               value: {}
 *     responses:
 *       200:
 *         description: Subscrição suspensa com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Subscrição suspensa com sucesso"
 *                 data:
 *                   type: object
 *       401:
 *         description: Token inválido ou não autenticado
 *       403:
 *         description: Sem permissão (requer PLAN_UPDATE)
 *       404:
 *         description: Subscrição não encontrada
 *       500:
 *         description: Erro ao suspender subscrição
 */
router.post('/admin/:organizationId/suspend', permissionGuard(PERMISSIONS.PLAN_UPDATE), (req, res) => subscriptionController.suspendSubscription(req as any, res));

/**
 * @swagger
 * /subscription/admin/{organizationId}/resume:
 *   post:
 *     tags: [Subscription - Admin]
 *     summary: Reativa uma subscrição suspensa
 *     description: Reativa uma subscrição que estava suspensa, permitindo que a organização volte a ter acesso total à plataforma.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: organizationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único da organização
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Subscrição reativada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Subscrição reativada com sucesso"
 *                 data:
 *                   type: object
 *       401:
 *         description: Token inválido ou não autenticado
 *       403:
 *         description: Sem permissão (requer PLAN_UPDATE)
 *       404:
 *         description: Subscrição não encontrada
 *       500:
 *         description: Erro ao reativar subscrição
 */
router.post('/admin/:organizationId/resume', permissionGuard(PERMISSIONS.PLAN_UPDATE), (req, res) => subscriptionController.resumeSubscription(req as any, res));

/**
 * @swagger
 * /subscription/admin/{organizationId}/extend:
 *   post:
 *     tags: [Subscription - Admin]
 *     summary: Estende a data de expiração da subscrição
 *     description: Prolonga o período da subscrição adicionando meses à data de expiração. Útil para cortesias, promoções ou pagamentos recebidos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: organizationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único da organização
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - months
 *             properties:
 *               months:
 *                 type: integer
 *                 description: Número de meses a adicionar
 *                 minimum: 1
 *                 example: 3
 *           examples:
 *             extend_3_months:
 *               value:
 *                 months: 3
 *             extend_1_month:
 *               value:
 *                 months: 1
 *             extend_12_months:
 *               value:
 *                 months: 12
 *     responses:
 *       200:
 *         description: Subscrição estendida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Subscrição estendida por 3 mês(es)"
 *                 data:
 *                   type: object
 *       400:
 *         description: Número de meses inválido
 *       401:
 *         description: Token inválido ou não autenticado
 *       403:
 *         description: Sem permissão (requer PLAN_UPDATE)
 *       404:
 *         description: Subscrição não encontrada
 *       500:
 *         description: Erro ao estender subscrição
 */
router.post('/admin/:organizationId/extend', permissionGuard(PERMISSIONS.PLAN_UPDATE), (req, res) => subscriptionController.extendSubscription(req as any, res));

/**
 * @swagger
 * /subscription/admin/{organizationId}/expire:
 *   post:
 *     tags: [Subscription - Admin]
 *     summary: Marca a subscrição como expirada
 *     description: Define o estado da subscrição como EXPIRED e a data de expiração para agora, revogando o acesso imediatamente.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscrição marcada como expirada
 *       403:
 *         description: Sem permissão (requer PLAN_UPDATE)
 *       404:
 *         description: Subscrição não encontrada
 */
router.post('/admin/:organizationId/expire', permissionGuard(PERMISSIONS.PLAN_UPDATE), (req, res) => subscriptionController.expireSubscription(req as any, res));

/**
 * @swagger
 * /subscription/admin/{organizationId}/change-plan:
 *   post:
 *     tags: [Subscription - Admin]
 *     summary: Muda o plano da subscrição
 *     description: Altera o plano da organização para outro plano. Automaticamente reativa a subscrição, atualiza o endDate e provisiona os módulos do novo plano.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: organizationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único da organização
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do novo plano
 *                 example: 660e8400-e29b-41d4-a716-446655440000
 *           examples:
 *             upgrade_to_professional:
 *               value:
 *                 planId: "660e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Plano alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Plano alterado com sucesso"
 *                 data:
 *                   type: object
 *       400:
 *         description: Plan ID não fornecido ou inválido
 *       401:
 *         description: Token inválido ou não autenticado
 *       403:
 *         description: Sem permissão (requer PLAN_UPDATE)
 *       404:
 *         description: Subscrição ou plano não encontrado
 *       500:
 *         description: Erro ao alterar plano
 */
router.post('/admin/:organizationId/change-plan', permissionGuard(PERMISSIONS.PLAN_UPDATE), (req, res) => subscriptionController.changeSubscriptionPlan(req as any, res));

/**
 * @swagger
 * /subscription/admin/{organizationId}/cancel:
 *   post:
 *     tags: [Subscription - Admin]
 *     summary: Cancela a subscrição
 *     description: Cancela permanentemente a subscrição, bloqueando acesso à plataforma e desativando todos os módulos. Esta ação é irreversível sem intervenção manual.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: organizationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único da organização
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Motivo do cancelamento (opcional, para auditoria)
 *                 example: "Solicitação do cliente"
 *           examples:
 *             with_reason:
 *               value:
 *                 reason: "Solicitação do cliente"
 *             without_reason:
 *               value: {}
 *     responses:
 *       200:
 *         description: Subscrição cancelada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Subscrição cancelada com sucesso"
 *                 data:
 *                   type: object
 *       401:
 *         description: Token inválido ou não autenticado
 *       403:
 *         description: Sem permissão (requer PLAN_DELETE)
 *       404:
 *         description: Subscrição não encontrada
 *       500:
 *         description: Erro ao cancelar subscrição
 */
router.post('/admin/:organizationId/cancel', permissionGuard(PERMISSIONS.PLAN_DELETE), (req, res) => subscriptionController.cancelSubscription(req as any, res));

export default router;
