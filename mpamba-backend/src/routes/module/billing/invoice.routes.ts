import { Router } from 'express';
import { invoiceController } from '../../../controller/module/billing/invoice.controller.js';
import { billingExportController } from '../../../controller/module/billing/export.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.INVOICE_VIEW) as any,
	(req, res) => invoiceController.listInvoices(req as any, res)
);

// Antes de '/:id', senão 'export' seria interpretado como um id de fatura.
router.get(
	'/export',
	permissionGuard(PERMISSIONS.INVOICE_VIEW) as any,
	(req, res) => billingExportController.exportInvoices(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.INVOICE_CREATE) as any,
	(req, res) => invoiceController.createInvoice(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.INVOICE_VIEW) as any,
	(req, res) => invoiceController.getInvoiceById(req as any, res)
);

router.patch(
	'/:id',
	permissionGuard(PERMISSIONS.INVOICE_UPDATE) as any,
	(req, res) => invoiceController.updateInvoice(req as any, res)
);

router.post(
	'/:id/issue',
	permissionGuard(PERMISSIONS.INVOICE_ISSUE) as any,
	(req, res) => invoiceController.issueInvoice(req as any, res)
);

router.post(
	'/:id/cancel',
	permissionGuard(PERMISSIONS.INVOICE_CANCEL) as any,
	(req, res) => invoiceController.cancelInvoice(req as any, res)
);

router.post(
	'/:id/duplicate',
	permissionGuard(PERMISSIONS.INVOICE_CREATE) as any,
	(req, res) => invoiceController.duplicateInvoice(req as any, res)
);

router.get(
	'/:id/pdf',
	permissionGuard(PERMISSIONS.INVOICE_VIEW) as any,
	(req, res) => invoiceController.downloadInvoicePDF(req as any, res)
);

router.post(
	'/:id/send',
	permissionGuard(PERMISSIONS.INVOICE_SEND) as any,
	(req, res) => invoiceController.sendInvoice(req as any, res)
);

router.patch(
	'/:id/payment-status',
	permissionGuard(PERMISSIONS.INVOICE_UPDATE) as any,
	(req, res) => invoiceController.markPaymentStatus(req as any, res)
);

export default router;
