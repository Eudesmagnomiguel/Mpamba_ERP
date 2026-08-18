import { Router } from 'express';
import { receiptController } from '../../../controller/module/billing/receipt.controller.js';
import { billingExportController } from '../../../controller/module/billing/export.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.BILLING_RECEIPT_VIEW) as any,
	(req, res) => receiptController.listReceipts(req as any, res)
);

// Antes de '/:id', senão 'export' seria interpretado como um id de recibo.
router.get(
	'/export',
	permissionGuard(PERMISSIONS.BILLING_RECEIPT_VIEW) as any,
	(req, res) => billingExportController.exportReceipts(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.BILLING_RECEIPT_CREATE) as any,
	(req, res) => receiptController.createReceipt(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.BILLING_RECEIPT_VIEW) as any,
	(req, res) => receiptController.getReceiptById(req as any, res)
);

router.post(
	'/:id/issue',
	permissionGuard(PERMISSIONS.BILLING_RECEIPT_CREATE) as any,
	(req, res) => receiptController.issueReceipt(req as any, res)
);

router.post(
	'/:id/cancel',
	permissionGuard(PERMISSIONS.BILLING_RECEIPT_CREATE) as any,
	(req, res) => receiptController.cancelReceipt(req as any, res)
);

router.get(
	'/:id/pdf',
	permissionGuard(PERMISSIONS.BILLING_RECEIPT_VIEW) as any,
	(req, res) => receiptController.downloadReceiptPDF(req as any, res)
);

export default router;
