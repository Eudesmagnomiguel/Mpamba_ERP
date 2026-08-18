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

// Retro-compatibility for /income, /expense, /transfer if needed, 
// but since we are reorganizing, it's better to use /movements/income etc.
// The original routes were:
// /treasury/income -> router.post('/income', ...)
// /treasury/expense -> router.post('/expense', ...)
// /treasury/transfer -> router.post('/transfer', ...)
// /treasury/movements -> router.get('/movements', ...)

// To maintain compatibility with the EXACT previous paths:
router.use('/', movementRoutes); 

export default router;
