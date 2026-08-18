import { Router } from 'express';
import { proformaController } from '../../../controller/module/billing/proforma.controller.js';
import { billingExportController } from '../../../controller/module/billing/export.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.BILLING_PROFORMA_VIEW) as any,
	(req, res) => proformaController.listProformas(req as any, res)
);

// Antes de '/:id', senão 'export' seria interpretado como um id de proforma.
router.get(
	'/export',
	permissionGuard(PERMISSIONS.BILLING_PROFORMA_VIEW) as any,
	(req, res) => billingExportController.exportProformas(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.BILLING_PROFORMA_CREATE) as any,
	(req, res) => proformaController.createProforma(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.BILLING_PROFORMA_VIEW) as any,
	(req, res) => proformaController.getProformaById(req as any, res)
);

router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.BILLING_PROFORMA_CREATE) as any,
	(req, res) => proformaController.updateProforma(req as any, res)
);

router.post(
	'/:id/convert',
	permissionGuard(PERMISSIONS.BILLING_PROFORMA_CREATE) as any,
	(req, res) => proformaController.convertProformaToInvoice(req as any, res)
);

router.post(
	'/:id/cancel',
	permissionGuard(PERMISSIONS.BILLING_PROFORMA_CREATE) as any,
	(req, res) => proformaController.cancelProforma(req as any, res)
);

router.get(
	'/:id/pdf',
	permissionGuard(PERMISSIONS.BILLING_PROFORMA_VIEW) as any,
	(req, res) => proformaController.downloadProformaPDF(req as any, res)
);

export default router;
