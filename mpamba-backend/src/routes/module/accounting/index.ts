import { Router } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware.js';
import { moduleGuard, subscriptionGuard } from '../../../middleware/subscription.guard.js';
import accountRoutes from './account.routes.js';
import journalRoutes from './journal.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use(authMiddleware as any);
router.use(subscriptionGuard as any);
router.use(moduleGuard('contabilidade') as any);

router.use('/accounts', accountRoutes);
router.use('/entries', journalRoutes);
router.use('/reports', reportRoutes);

export default router;
