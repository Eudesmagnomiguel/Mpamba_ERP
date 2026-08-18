import { Router } from 'express';
import { accountingAccountController } from '../../../controller/module/accounting/account.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get('/', permissionGuard(PERMISSIONS.ACCOUNTING_ACCOUNT_VIEW), (req, res) => accountingAccountController.list(req as any, res));
router.get('/:id', permissionGuard(PERMISSIONS.ACCOUNTING_ACCOUNT_VIEW), (req, res) => accountingAccountController.getById(req as any, res));
router.post('/', permissionGuard(PERMISSIONS.ACCOUNTING_ACCOUNT_CREATE), (req, res) => accountingAccountController.create(req as any, res));
router.patch('/:id', permissionGuard(PERMISSIONS.ACCOUNTING_ACCOUNT_UPDATE), (req, res) => accountingAccountController.update(req as any, res));
router.delete('/:id', permissionGuard(PERMISSIONS.ACCOUNTING_ACCOUNT_UPDATE), (req, res) => accountingAccountController.delete(req as any, res));

export default router;
