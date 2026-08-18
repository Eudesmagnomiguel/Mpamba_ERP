import { Router } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware.js';
import { moduleGuard, subscriptionGuard } from '../../../middleware/subscription.guard.js';
import invoiceRoutes from './invoice.routes.js';
import proformaRoutes from './proforma.routes.js';
import creditNoteRoutes from './credit-note.routes.js';
import receiptRoutes from './receipt.routes.js';
import seriesRoutes from './series.routes.js';
import serviceRoutes from './service.routes.js';
import taxRoutes from './tax.routes.js';
import statsRoutes from './stats.routes.js';
import customerRoutes from './customer.routes.js';
import posRoutes from './pos.routes.js';

const router = Router();

router.use(authMiddleware as any);
router.use(subscriptionGuard as any);
router.use(moduleGuard('faturacao') as any);

router.use('/stats', statsRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/proformas', proformaRoutes);
router.use('/credit-notes', creditNoteRoutes);
router.use('/receipts', receiptRoutes);
router.use('/series', seriesRoutes);
router.use('/services', serviceRoutes);
router.use('/tax-rules', taxRoutes);
router.use('/customers', customerRoutes);
router.use('/pos', posRoutes);

export default router;
