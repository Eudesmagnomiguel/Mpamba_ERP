import { Router } from 'express';
import { creditNoteController } from '../../../controller/module/billing/credit-note.controller.js';
import { billingExportController } from '../../../controller/module/billing/export.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get(
	'/',
	permissionGuard(PERMISSIONS.BILLING_CREDIT_NOTE_VIEW) as any,
	(req, res) => creditNoteController.listCreditNotes(req as any, res)
);

// Antes de '/:id', senão 'export' seria interpretado como um id de nota de crédito.
router.get(
	'/export',
	permissionGuard(PERMISSIONS.BILLING_CREDIT_NOTE_VIEW) as any,
	(req, res) => billingExportController.exportCreditNotes(req as any, res)
);

router.post(
	'/',
	permissionGuard(PERMISSIONS.BILLING_CREDIT_NOTE_CREATE) as any,
	(req, res) => creditNoteController.createCreditNote(req as any, res)
);

router.get(
	'/:id',
	permissionGuard(PERMISSIONS.BILLING_CREDIT_NOTE_VIEW) as any,
	(req, res) => creditNoteController.getCreditNoteById(req as any, res)
);

router.post(
	'/:id/issue',
	permissionGuard(PERMISSIONS.BILLING_CREDIT_NOTE_CREATE) as any,
	(req, res) => creditNoteController.issueCreditNote(req as any, res)
);

router.post(
	'/:id/cancel',
	permissionGuard(PERMISSIONS.BILLING_CREDIT_NOTE_CREATE) as any,
	(req, res) => creditNoteController.cancelCreditNote(req as any, res)
);

router.get(
	'/:id/pdf',
	permissionGuard(PERMISSIONS.BILLING_CREDIT_NOTE_VIEW) as any,
	(req, res) => creditNoteController.downloadCreditNotePDF(req as any, res)
);

export default router;
