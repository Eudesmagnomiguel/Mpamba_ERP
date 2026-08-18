import { Router } from 'express';
import { subscriptionRequestController } from '../../controller/core/subscription-request.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { permissionGuard } from '../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.use(authMiddleware as any);

// User endpoints
router.post('/', (req, res) => subscriptionRequestController.create(req as any, res));
router.get('/me', (req, res) => subscriptionRequestController.getMyRequests(req as any, res));

// Admin endpoints
router.get('/admin', permissionGuard(PERMISSIONS.PLAN_VIEW), (req, res) => subscriptionRequestController.getAllRequests(req as any, res));
router.post('/admin/:id/approve', permissionGuard(PERMISSIONS.PLAN_UPDATE), (req, res) => subscriptionRequestController.approve(req as any, res));
router.post('/admin/:id/reject', permissionGuard(PERMISSIONS.PLAN_UPDATE), (req, res) => subscriptionRequestController.reject(req as any, res));

export default router;
