import { Router } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware.js';
import { moduleGuard, subscriptionGuard } from '../../../middleware/subscription.guard.js';
import accountRoutes from './account.routes.js';
import categoryRoutes from './category.routes.js';
import movementRoutes from './movement.routes.js';
import reportRoutes from './report.routes.js';
import costCenterRoutes from './cost-center.routes.js';
import payableRoutes from './payable.routes.js';
import receivableRoutes from './receivable.routes.js';
import cashSessionRoutes from './cash-session.routes.js';
import bankStatementRoutes from './bank-statement.routes.js';
import { movementController } from '../../../controller/module/treasury/movement.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.use(authMiddleware as any);
router.use(subscriptionGuard as any);
router.use(moduleGuard('tesouraria') as any);

router.use('/accounts', accountRoutes);
router.use('/categories', categoryRoutes);
router.use('/movements', movementRoutes);
router.use('/reports', reportRoutes);
router.use('/cost-centers', costCenterRoutes);
router.use('/payables', payableRoutes);
router.use('/receivables', receivableRoutes);
router.use('/cash-sessions', cashSessionRoutes);
router.use('/bank-statements', bankStatementRoutes);

// Retro-compatibilidade com os caminhos antigos (/treasury/income, /expense,
// /transfer). Montados um a um em vez de `router.use('/', movementRoutes)`,
// porque o router de movimentos passou a ter rotas `/:id` que apanhariam
// qualquer caminho não resolvido pelos routers acima.
router.post(
	'/income',
	permissionGuard(PERMISSIONS.TREASURY_TRANSACTION_CREATE) as any,
	(req, res) => movementController.addIncome(req as any, res)
);
router.post(
	'/expense',
	permissionGuard(PERMISSIONS.TREASURY_TRANSACTION_CREATE) as any,
	(req, res) => movementController.addExpense(req as any, res)
);
router.post(
	'/transfer',
	permissionGuard(PERMISSIONS.TREASURY_TRANSFER_CREATE) as any,
	(req, res) => movementController.transfer(req as any, res)
);

export default router;
