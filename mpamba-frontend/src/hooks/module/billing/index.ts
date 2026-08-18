export * from './useCustomers';
export * from './useInvoices';
export * from './useProformas';
export * from './useCreditNotes';
export * from './useReceipts';
export * from './useSeries';
export * from './useServices';
export * from './useTaxRules';
export * from './useStats';

import { seriesService } from '@/services/module/billing/series.service';
import { invoiceService } from '@/services/module/billing/invoice.service';
import { receiptService } from '@/services/module/billing/receipt.service';
import { proformaService } from '@/services/module/billing/proforma.service';
import { creditNoteService } from '@/services/module/billing/credit-note.service';

export const useBilling = () => ({
	getSeries: () => seriesService.listSeries(),
	getInvoices: (params?: any) => invoiceService.listInvoices(params),
	getReceipts: (params?: any) => receiptService.listReceipts(params),
	getProformas: (params?: any) => proformaService.listProformas(params),
	getCreditNotes: (params?: any) => creditNoteService.listCreditNotes(params),
});
