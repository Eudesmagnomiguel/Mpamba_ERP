import { Router } from 'express';
import { UserController } from '../../controller/core/user.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { permissionGuard } from '../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.use(authMiddleware as any);

router.get('/', permissionGuard(PERMISSIONS.USER_VIEW), UserController.list as any);
router.get('/:id', permissionGuard(PERMISSIONS.USER_VIEW), UserController.getById as any);
router.post('/', permissionGuard(PERMISSIONS.USER_CREATE), UserController.create as any);
router.put('/:id', permissionGuard(PERMISSIONS.USER_UPDATE), UserController.update as any);
router.delete('/:id', permissionGuard(PERMISSIONS.USER_DELETE), UserController.delete as any);

export default router;
