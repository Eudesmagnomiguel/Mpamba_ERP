import { Router } from 'express';
import { journalController } from '../../../controller/module/accounting/journal.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get('/', permissionGuard(PERMISSIONS.ACCOUNTING_ENTRY_VIEW), (req, res) => journalController.list(req as any, res));
router.get('/:id', permissionGuard(PERMISSIONS.ACCOUNTING_ENTRY_VIEW), (req, res) => journalController.getById(req as any, res));
router.post('/', permissionGuard(PERMISSIONS.ACCOUNTING_ENTRY_CREATE), (req, res) => journalController.create(req as any, res));
router.post('/:id/reverse', permissionGuard(PERMISSIONS.ACCOUNTING_ENTRY_CREATE), (req, res) => journalController.reverse(req as any, res));

export default router;
