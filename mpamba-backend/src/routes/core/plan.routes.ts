/**
 * @fileoverview Rotas de planos
 * @description Define todos os endpoints para gerenciar planos do sistema
 */

import { Router } from 'express';
import { PlanController } from '../../controller/core/plan.controller.js';
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { cacheMiddleware, clearCacheMiddleware } from '../../middleware/cache.middleware.js';

const router = Router();

/**
 * @swagger
 * /plans:
 *   get:
 *     tags:
 *       - Plans
 *     summary: Lista todos os planos
 *     description: Retorna uma lista paginada de todos os planos disponíveis no sistema
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
 *         description: Lista de planos retornada com sucesso
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       interval:
 *                         type: string
 *                       modules:
 *                         type: array
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', cacheMiddleware(600, 'plans:'), PlanController.list);

/**
 * @swagger
 * /plans/{code}:
 *   get:
 *     tags:
 *       - Plans
 *     summary: Obtém um plano por código
 *     description: Retorna os detalhes de um plano específico incluindo seus módulos
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do plano
 *     responses:
 *       200:
 *         description: Plano retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     code:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                     interval:
 *                       type: string
 *                     modules:
 *                       type: array
 *       400:
 *         description: Código do plano é obrigatório
 *       404:
 *         description: Plano não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:code', cacheMiddleware(600, 'plans:'), PlanController.getByCode);

/**
 * @swagger
 * /plans:
 *   post:
 *     tags:
 *       - Plans
 *     summary: Cria um novo plano
 *     description: Cria um novo plano no sistema com módulos associados
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
 *               - name
 *               - price
 *             properties:
 *               code:
 *                 type: string
 *                 example: "plan_basic"
 *                 description: Código único do plano
 *               name:
 *                 type: string
 *                 example: "Plano Básico"
 *                 description: Nome do plano
 *               description:
 *                 type: string
 *                 example: "Plano básico para pequenas organizações"
 *                 description: Descrição do plano
 *               price:
 *                 type: number
 *                 example: 29.99
 *                 description: Preço do plano
 *               interval:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 example: "monthly"
 *                 description: Intervalo de cobrança
 *               moduleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs dos módulos incluídos no plano
 *     responses:
 *       201:
 *         description: Plano criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Dados de entrada inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', authMiddleware as any, clearCacheMiddleware('plans:'), PlanController.create);

/**
 * @swagger
 * /plans/{id}:
 *   put:
 *     tags:
 *       - Plans
 *     summary: Atualiza um plano existente
 *     description: Atualiza os dados e módulos de um plano existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do plano a atualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Código do plano
 *               name:
 *                 type: string
 *                 description: Nome do plano
 *               description:
 *                 type: string
 *                 description: Descrição do plano
 *               price:
 *                 type: number
 *                 description: Preço do plano
 *               interval:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 description: Intervalo de cobrança
 *               moduleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs dos módulos
 *     responses:
 *       200:
 *         description: Plano atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: ID do plano é obrigatório ou dados inválidos
 *       404:
 *         description: Plano não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', authMiddleware as any, clearCacheMiddleware('plans:'), PlanController.update);

/**
 * @swagger
 * /plans/{id}:
 *   delete:
 *     tags:
 *       - Plans
 *     summary: Remove um plano
 *     description: Deleta um plano do sistema (não é possível deletar planos em uso)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do plano a remover
 *     responses:
 *       204:
 *         description: Plano removido com sucesso
 *       400:
 *         description: ID do plano é obrigatório
 *       409:
 *         description: Plano não pode ser removido pois está em uso por organizações
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', authMiddleware as any, clearCacheMiddleware('plans:'), PlanController.delete);

export default router;