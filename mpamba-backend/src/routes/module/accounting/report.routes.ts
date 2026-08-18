import { Router } from 'express';
import { accountingReportController } from '../../../controller/module/accounting/report.controller.js';
import { permissionGuard } from '../../../shared/utils/rbac/permission.guard.js';
import { PERMISSIONS } from '../../../shared/utils/rbac/permission.constants.js';

const router = Router();

router.get('/trial-balance', permissionGuard(PERMISSIONS.ACCOUNTING_REPORT_VIEW), (req, res) => accountingReportController.trialBalance(req as any, res));
router.get('/ledger/:accountId', permissionGuard(PERMISSIONS.ACCOUNTING_REPORT_VIEW), (req, res) => accountingReportController.ledger(req as any, res));
router.get('/income-statement', permissionGuard(PERMISSIONS.ACCOUNTING_REPORT_VIEW), (req, res) => accountingReportController.incomeStatement(req as any, res));
router.get('/balance-sheet', permissionGuard(PERMISSIONS.ACCOUNTING_REPORT_VIEW), (req, res) => accountingReportController.balanceSheet(req as any, res));

// Exportação Excel (.xlsx) — mesmos dados e mesma permissão dos endpoints acima.
router.get('/trial-balance/export', permissionGuard(PERMISSIONS.ACCOUNTING_REPORT_VIEW), (req, res) => accountingReportController.trialBalanceExcel(req as any, res));
router.get('/ledger/:accountId/export', permissionGuard(PERMISSIONS.ACCOUNTING_REPORT_VIEW), (req, res) => accountingReportController.ledgerExcel(req as any, res));
router.get('/income-statement/export', permissionGuard(PERMISSIONS.ACCOUNTING_REPORT_VIEW), (req, res) => accountingReportController.incomeStatementExcel(req as any, res));
router.get('/balance-sheet/export', permissionGuard(PERMISSIONS.ACCOUNTING_REPORT_VIEW), (req, res) => accountingReportController.balanceSheetExcel(req as any, res));

export default router;
