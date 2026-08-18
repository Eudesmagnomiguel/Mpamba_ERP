import { customerService } from './customer.service';
import { invoiceService } from './invoice.service';
import { proformaService } from './proforma.service';
import { creditNoteService } from './credit-note.service';
import { receiptService } from './receipt.service';
import { seriesService } from './series.service';
import { catalogService } from './service.service';
import { taxService } from './tax.service';
import { statsService } from './stats.service';
import { billingExportService } from './export.service';

export { billingExportService };

export const billingServices = {
	...customerService,
	...invoiceService,
	...proformaService,
	...creditNoteService,
	...receiptService,
	...seriesService,
	...catalogService,
	...taxService,
	...statsService,
	...billingExportService,
};

export default billingServices;
