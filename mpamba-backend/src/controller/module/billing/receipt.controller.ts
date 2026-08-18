import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { receiptService } from '../../../services/module/billing/receipt.service.js';
import {
	createReceiptSchema,
} from '../../../shared/dto/billing.dto.js';
import { pdfService } from '../../../services/module/pdf.service.js';

export class ReceiptController {
	async listReceipts(req: AuthRequest, res: Response) {
		try {
			const { invoiceId, search } = req.query;
			const receipts = await receiptService.listReceipts({
				invoiceId: invoiceId as string,
				search: search as string,
			});
			res.json({ data: receipts });
		} catch (error: any) {
			console.error(`[ReceiptController.listReceipts] Error:`, error);
			res.status(500).json({ message: error.message });
		}
	}

	async createReceipt(req: AuthRequest, res: Response) {
		try {
			const validation = createReceiptSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const receipt = await receiptService.createReceipt(validation.data);
			res.status(201).json({ data: receipt });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getReceiptById(req: AuthRequest, res: Response) {
		try {
			const receipt = await receiptService.getReceiptById(req.params.id as string);
			res.json({ data: receipt });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 500;
			console.error(`[ReceiptController.getReceiptById] Error:`, error);
			res.status(status).json({ message: error.message });
		}
	}

	async issueReceipt(req: AuthRequest, res: Response) {
		try {
			const receipt = await receiptService.issueReceipt(req.params.id as string);
			res.json({ data: receipt });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 422;
			console.error(`[ReceiptController.issueReceipt] Error:`, error);
			res.status(status).json({ message: error.message });
		}
	}

	async cancelReceipt(req: AuthRequest, res: Response) {
		try {
			await receiptService.cancelReceipt(req.params.id as string);
			res.json({ message: 'Recibo cancelado com sucesso' });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async downloadReceiptPDF(req: AuthRequest, res: Response) {
		try {
			const receipt = (await receiptService.getReceiptById(req.params.id as string)) as any;
			
			// Map data to BillingDocument format
			const docData = {
				...receipt,
				customerName: receipt.invoice.customerName,
				customerNif: receipt.invoice.customerNif,
				customerAddress: receipt.invoice.customerAddress,
				currency: receipt.invoice.currency,
				total: receipt.amount,
				subtotal: receipt.amount,
				taxTotal: 0,
				discountTotal: 0,
				invoiceNumber: receipt.invoice.number,
				notes: receipt.notes || receipt.organization?.invoiceFooterNote || null
			};

			const format = String(req.query.format || '').toUpperCase() === 'THERMAL' ? 'THERMAL' : 'A4';
			const pdfBuffer = await pdfService.generateReceiptPDF(docData, format);
			
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', `attachment; filename=recibo-${receipt.number || req.params.id}.pdf`);
			res.send(pdfBuffer);
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}
}

export const receiptController = new ReceiptController();
