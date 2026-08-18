import { Router } from 'express';
import { ModuleController } from '../../controller/core/module.controller.js';
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { permissionGuard } from '../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../shared/utils/rbac/permission.constants.js';

const router = Router();

// Todas as rotas de módulos requerem autenticação
router.use(authMiddleware as any);

router.get('/', permissionGuard(PERMISSIONS.ROLE_VIEW), ModuleController.list);
router.get('/:id', permissionGuard(PERMISSIONS.ROLE_VIEW), ModuleController.getById);
router.post('/', permissionGuard(PERMISSIONS.ROLE_CREATE), ModuleController.create);
router.put('/:id', permissionGuard(PERMISSIONS.ROLE_UPDATE), ModuleController.update);
router.delete('/:id', permissionGuard(PERMISSIONS.ROLE_DELETE), ModuleController.delete);

export default router;
