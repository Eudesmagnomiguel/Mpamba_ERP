import { Router } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware.js';
import { moduleGuard, subscriptionGuard } from '../../../middleware/subscription.guard.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import supplierRoutes from './supplier.routes.js';
import movementRoutes from './movement.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use(authMiddleware as any);
router.use(subscriptionGuard as any);
router.use(moduleGuard('stock') as any);

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/movements', movementRoutes);
router.use('/', reportRoutes); // For /summary and /insights

export default router;
