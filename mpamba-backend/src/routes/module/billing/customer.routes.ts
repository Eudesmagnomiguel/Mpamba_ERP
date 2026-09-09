import { Router } from 'express';
import { customerController } from '../../../controller/module/billing/customer.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

// As rotas de clientes guardam-se com as permissões customer:* e não com as de
// faturação: os perfis pré-configurados (ROLE_TEMPLATES) e o menu do frontend
// já usam customer:view/create/update/delete, e a divergência bloqueava, por
// exemplo, o registo de um cliente por quem tem customer:create mas não
// invoice:create.

router.get(
	'/',
	permissionGuard(PERMISSIONS.CUSTOMER_VIEW) as any,
	(req, res) => customerController.list(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.CUSTOMER_VIEW) as any,
	(req, res) => customerController.getById(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.CUSTOMER_CREATE) as any,
	(req, res) => customerController.create(req as any, res)
);

router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.CUSTOMER_UPDATE) as any,
	(req, res) => customerController.update(req as any, res)
);

router.delete(
	'/:id',
	permissionGuard(PERMISSIONS.CUSTOMER_DELETE) as any,
	(req, res) => customerController.delete(req as any, res)
);

export default router;
