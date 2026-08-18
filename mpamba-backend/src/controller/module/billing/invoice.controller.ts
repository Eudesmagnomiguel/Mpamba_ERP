import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { invoiceService } from '../../../services/module/billing/invoice.service.js';
import {
	createInvoiceSchema,
	updateInvoiceSchema,
	cancelInvoiceSchema,
	markPaymentStatusSchema,
} from '../../../shared/dto/billing.dto.js';
import { pdfService } from '../../../services/module/pdf.service.js';

export class InvoiceController {
	async listInvoices(req: AuthRequest, res: Response) {
		try {
			const { search, status, page, limit } = req.query;
			const result = await invoiceService.listInvoices({
				search: search as string,
				status: status as string,
				page: page ? Number(page) : 1,
				limit: limit ? Number(limit) : 20,
			});
			res.json(result);
		} catch (error: any) {
			console.error(`[InvoiceController.listInvoices] Error:`, error);
			res.status(500).json({ message: error.message });
		}
	}

	async createInvoice(req: AuthRequest, res: Response) {
		try {
			const validation = createInvoiceSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const invoice = await invoiceService.createInvoice(validation.data);
			res.status(201).json({ data: invoice });
		} catch (error: any) {
			console.error(`[InvoiceController.listInvoices] Error:`, error);
			res.status(500).json({ message: error.message });
		}
	}

	async updateInvoice(req: AuthRequest, res: Response) {
		try {
			const validation = updateInvoiceSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const invoice = await invoiceService.updateInvoice(req.params.id as string, validation.data);
			res.json({ data: invoice });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 422;
			res.status(status).json({ message: error.message });
		}
	}

	async getInvoiceById(req: AuthRequest, res: Response) {
		try {
			const invoice = await invoiceService.getInvoiceById(req.params.id as string);
			res.json({ data: invoice });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async issueInvoice(req: AuthRequest, res: Response) {
		try {
			const invoice = await invoiceService.issueInvoice(req.params.id as string);
			res.json({ data: invoice });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 422;
			res.status(status).json({ message: error.message });
		}
	}

	async cancelInvoice(req: AuthRequest, res: Response) {
		try {
			const validation = cancelInvoiceSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const invoice = await invoiceService.cancelInvoice(req.params.id as string, validation.data);
			res.json({ data: invoice });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 422;
			res.status(status).json({ message: error.message });
		}
	}

	async duplicateInvoice(req: AuthRequest, res: Response) {
		try {
			const invoice = await invoiceService.duplicateInvoice(req.params.id as string);
			res.status(201).json({ data: invoice });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async downloadInvoicePDF(req: AuthRequest, res: Response) {
		try {
			const invoice: any = await invoiceService.getInvoiceById(req.params.id as string);
			const notes = invoice.notes || invoice.organization?.invoiceFooterNote || null;
			const format = String(req.query.format || '').toUpperCase() === 'THERMAL' ? 'THERMAL' : 'A4';
			const pdfBuffer = await pdfService.generateInvoicePDF({ ...invoice, notes }, format);
			
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', `attachment; filename=fatura-${req.params.id}.pdf`);
			res.send(pdfBuffer);
		} catch (error: any) {
			console.error(`[InvoiceController.listInvoices] Error:`, error);
			res.status(500).json({ message: error.message });
		}
	}

	async sendInvoice(req: AuthRequest, res: Response) {
		try {
			const { email } = req.body;
			if (!email) return res.status(400).json({ message: 'Email de destino é obrigatório' });

			const invoice: any = await invoiceService.getInvoiceById(req.params.id as string);
			const { sendEmail } = await import('../../../shared/utils/email.utils.js');
			const { getInvoiceEmailTemplate } = await import('../../../shared/utils/email-templates.utils.js');

			if (invoice.status === 'DRAFT') throw new Error('Não é possível enviar faturas em rascunho. Emita a fatura primeiro.');

			const notes = invoice.notes || invoice.organization?.invoiceFooterNote || null;
			const pdfBuffer = await pdfService.generateInvoicePDF({ ...invoice, notes });

			const result = await sendEmail({
				to: email,
				subject: `Fatura ${invoice.number} - Mpamba`,
				html: getInvoiceEmailTemplate(
					invoice.customerName,
					invoice.number!,
					invoice.total.toFixed(2),
					invoice.currency
				),
				attachments: [
					{
						filename: `${invoice.number}.pdf`,
						content: pdfBuffer,
						contentType: 'application/pdf',
					},
				],
			});

			if (!result.success) throw new Error(`Falha ao enviar email: ${result.error}`);
			res.json({ message: 'Email enviado com sucesso', data: result });
		} catch (error: any) {
			console.error(`[InvoiceController.listInvoices] Error:`, error);
			res.status(500).json({ message: error.message });
		}
	}

	async markPaymentStatus(req: AuthRequest, res: Response) {
		try {
			const validation = markPaymentStatusSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const invoice = await invoiceService.markPaymentStatus(req.params.id as string, validation.data);
			res.json({ data: invoice });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 422;
			res.status(status).json({ message: error.message });
		}
	}
}

export const invoiceController = new InvoiceController();
