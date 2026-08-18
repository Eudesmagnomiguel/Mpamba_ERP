import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { creditNoteService } from '../../../services/module/billing/credit-note.service.js';
import {
	createCreditNoteSchema,
} from '../../../shared/dto/billing.dto.js';
import { pdfService } from '../../../services/module/pdf.service.js';

export class CreditNoteController {
	async listCreditNotes(req: AuthRequest, res: Response) {
		try {
			const { invoiceId, search } = req.query;
			const creditNotes = await creditNoteService.listCreditNotes({
				invoiceId: invoiceId as string,
				search: search as string,
			});
			res.json({ data: creditNotes });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async createCreditNote(req: AuthRequest, res: Response) {
		try {
			const validation = createCreditNoteSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const creditNote = await creditNoteService.createCreditNote(validation.data);
			res.status(201).json({ data: creditNote });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getCreditNoteById(req: AuthRequest, res: Response) {
		try {
			const creditNote = await creditNoteService.getCreditNoteById(req.params.id as string);
			res.json({ data: creditNote });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async issueCreditNote(req: AuthRequest, res: Response) {
		try {
			const creditNote = await creditNoteService.issueCreditNote(req.params.id as string);
			res.json({ data: creditNote });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 422;
			res.status(status).json({ message: error.message });
		}
	}

	async cancelCreditNote(req: AuthRequest, res: Response) {
		try {
			await creditNoteService.cancelCreditNote(req.params.id as string);
			res.json({ message: 'Nota de crédito cancelada com sucesso' });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async downloadCreditNotePDF(req: AuthRequest, res: Response) {
		try {
			const creditNote = (await creditNoteService.getCreditNoteById(req.params.id as string)) as any;
			
			// Map data to BillingDocument format
			const docData = {
				...creditNote,
				customerName: creditNote.invoice.customerName,
				customerNif: creditNote.invoice.customerNif,
				customerAddress: creditNote.invoice.customerAddress,
				currency: creditNote.invoice.currency,
				total: creditNote.amount,
				subtotal: creditNote.amount, // Basic mapping, items will be handled by PDF service
				taxTotal: 0,
				discountTotal: 0,
				invoiceNumber: creditNote.invoice.number
			};

			const pdfBuffer = await pdfService.generateCreditNotePDF(docData);
			
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', `attachment; filename=nota-credito-${creditNote.number || req.params.id}.pdf`);
			res.send(pdfBuffer);
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}
}

export const creditNoteController = new CreditNoteController();
