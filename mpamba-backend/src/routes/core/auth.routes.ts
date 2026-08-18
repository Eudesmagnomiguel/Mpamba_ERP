/**
 * @fileoverview Rotas de autenticação e autorização
 * @description Define todos os endpoints de autenticação, registro, login e gerenciamento de permissões
 */

import { Router } from 'express';
import { AuthController } from '../../controller/core/auth.controller.js';
import { permissionGuard } from '../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../shared/utils/rbac/permission.constants.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { authRateLimiter } from '../../shared/utils/security.utils.js';

export const authRoutes = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Autentica um usuário
 *     description: Autentica um usuário com credenciais (email/senha) com proteção contra brute force
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciais inválidas
 *       429:
 *         description: Muitas tentativas de login (rate limit excedido)
 */
authRoutes.post('/login', authRateLimiter, AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Renova um token JWT
 *     description: Renova um token JWT expirado usando um refresh token válido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Refresh token inválido ou expirado
 *       429:
 *         description: Muitas tentativas (rate limit excedido)
 */
authRoutes.post('/refresh', authRateLimiter, AuthController.refresh);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Registra uma nova organização e usuário administrador
 *     description: Cria uma nova organização e sua conta de administrador. A organização fica pendente de aprovação.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orgName
 *               - nif
 *               - adminName
 *               - adminEmail
 *               - password
 *             properties:
 *               orgName:
 *                 type: string
 *                 description: Nome da organização
 *                 example: Mpamba Tech Solutions
 *               nif:
 *                 type: string
 *                 description: Número de Identificação Fiscal
 *                 example: "123456789"
 *               adminName:
 *                 type: string
 *                 description: Nome completo do administrador
 *                 example: João Silva
 *               adminEmail:
 *                 type: string
 *                 format: email
 *                 description: Email do administrador
 *                 example: admin@mpamba.com
 *               password:
 *                 type: string
 *                 description: Senha de acesso
 *                 example: SecurePassword123!
 *               address:
 *                 type: string
 *                 description: Endereço da organização (opcional)
 *                 example: Rua Principal, 123, Lisboa
 *               phone:
 *                 type: string
 *                 description: Telefone da organização (opcional)
 *                 example: "+351 21 1234567"
 *               orgEmail:
 *                 type: string
 *                 format: email
 *                 description: Email de contato da organização (opcional)
 *                 example: contato@mpamba.com
 *     responses:
 *       201:
 *         description: Organização registrada com sucesso (pendente de aprovação)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Candidatura submetida com sucesso! A equipa Mpamba irá rever o seu pedido."
 *       400:
 *         description: Email já existe ou dados inválidos
 *       429:
 *         description: Muitas tentativas de registro (rate limit excedido)
 */
authRoutes.post('/register', authRateLimiter, AuthController.register);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Pede a recuperação de senha
 *     description: Envia um email com um link de recuperação de senha, caso o email exista
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Pedido processado (mensagem genérica, não revela se o email existe)
 *       429:
 *         description: Muitas tentativas (rate limit excedido)
 */
authRoutes.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Redefine a senha usando um token de recuperação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *       400:
 *         description: Token inválido ou expirado
 *       429:
 *         description: Muitas tentativas (rate limit excedido)
 */
authRoutes.post('/reset-password', authRateLimiter, AuthController.resetPassword);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Encerra a sessão do usuário
 *     description: Realiza logout e invalida os tokens da sessão
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *       401:
 *         description: Token inválido ou expirado
 */
authRoutes.post('/logout', authMiddleware, AuthController.logout);

/**
 * @swagger
 * /auth/activate:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Ativa uma organização
 *     description: Ativa uma organização (geralmente após aprovação do admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *                 description: ID da organização a ativar
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Conta ativada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Conta ativada com sucesso!"
 *       400:
 *         description: Organização já está ativa ou não encontrada
 *       404:
 *         description: Organização não encontrada
 */
authRoutes.post('/activate', AuthController.activate);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Retorna os dados do usuário autenticado
 *     description: Obtém informações completas do usuário logado incluindo permissões
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Token inválido ou expirado
 */
authRoutes.get('/me', authMiddleware, AuthController.me);
authRoutes.put('/me', authMiddleware, AuthController.updateMe);

/**
 * @swagger
 * /auth/onboarding/complete:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Marca o onboarding do utilizador autenticado como concluído
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding marcado como concluído
 *       401:
 *         description: Token inválido ou expirado
 */
authRoutes.post('/onboarding/complete', authMiddleware, AuthController.completeOnboarding);

/**
 * @swagger
 * /auth/pending:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Lista organizações aguardando aprovação
 *     description: Retorna todas as subscrições pendentes (organizações não ativas)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de organizações pendentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   nif:
 *                     type: string
 *                   email:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   users:
 *                     type: array
 *                     items:
 *                       type: object
 *       401:
 *         description: Token inválido ou expirado
 *       403:
 *         description: Sem permissão (não é administrador)
 */
authRoutes.get('/pending', authMiddleware, permissionGuard(PERMISSIONS.ORGANIZATION_VIEW), AuthController.listPending);

/**
 * @swagger
 * /auth/approve/{id}:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Aprova uma organização pendente
 *     description: Aprova e ativa uma organização e seus usuários (apenas para admins)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização a aprovar
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Organização aprovada e ativada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Organização aprovada e ativada com sucesso."
 *       401:
 *         description: Token inválido ou expirado
 *       403:
 *         description: Sem permissão (não é administrador)
 *       404:
 *         description: Organização não encontrada
 *       400:
 *         description: Organização já está ativa
 */
authRoutes.post('/approve/:id', authMiddleware, permissionGuard(PERMISSIONS.ORGANIZATION_UPDATE), AuthController.approve);

/**
 * @swagger
 * /auth/activate-directly/{organizationId}:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Ativa uma organização diretamente (Super Admin)
 *     description: Ativa uma organização, seus usuários e provisiona módulos sem necessidade de código (apenas Super Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: organizationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização a ativar diretamente
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Organização ativada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Organização ativada com sucesso!"
 *       401:
 *         description: Token inválido ou expirado
 *       403:
 *         description: Sem permissão (requer Super Admin)
 *       404:
 *         description: Organização não encontrada
 *       400:
 *         description: Organização já está ativa
 */
authRoutes.post('/activate-directly/:organizationId', authMiddleware, permissionGuard(PERMISSIONS.ORGANIZATION_UPDATE), AuthController.activateDirectly);

/**
 * @swagger
 * /auth/activate-with-code:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Ativa uma organização com código de ativação
 *     description: Ativa uma organização usando o código de ativação recebido por email. Automaticamente subscreve ao plano.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - code
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *                 description: ID da organização
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               code:
 *                 type: string
 *                 description: Código de ativação (8 caracteres alfanuméricos)
 *                 example: "ABCD1234"
 *     responses:
 *       200:
 *         description: Organização ativada com sucesso e subscrição ativa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Organização ativada com sucesso! Subscrição no plano ativa."
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       type: object
 *       400:
 *         description: Código inválido, expirado ou já utilizado
 *       404:
 *         description: Organização não encontrada
 */
authRoutes.post('/activate-with-code', AuthController.activateWithCode);