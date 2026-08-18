import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { proformaService } from '../../../services/module/billing/proforma.service.js';
import {
	createProformaSchema,
	updateProformaSchema,
	convertProformaSchema,
} from '../../../shared/dto/billing.dto.js';
import { pdfService } from '../../../services/module/pdf.service.js';

export class ProformaController {
	async listProformas(req: AuthRequest, res: Response) {
		try {
			const { search, status } = req.query;
			const proformas = await proformaService.listProformas({
				search: search as string,
				status: status as string,
			});
			res.json({ data: proformas });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async createProforma(req: AuthRequest, res: Response) {
		try {
			const validation = createProformaSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const proforma = await proformaService.createProforma(validation.data);
			res.status(201).json({ data: proforma });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getProformaById(req: AuthRequest, res: Response) {
		try {
			const proforma = await proformaService.getProformaById(req.params.id as string);
			res.json({ data: proforma });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async updateProforma(req: AuthRequest, res: Response) {
		try {
			const validation = updateProformaSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const proforma = await proformaService.updateProforma(req.params.id as string, validation.data);
			res.json({ data: proforma });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 422;
			res.status(status).json({ message: error.message });
		}
	}

	async convertProformaToInvoice(req: AuthRequest, res: Response) {
		try {
			const validation = convertProformaSchema.optional().safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const invoice = await proformaService.convertProformaToInvoice(req.params.id as string, validation.data);
			res.status(201).json({ data: invoice });
		} catch (error: any) {
			const status = error.message.includes('não encontrada') ? 404 : 422;
			res.status(status).json({ message: error.message });
		}
	}

	async cancelProforma(req: AuthRequest, res: Response) {
		try {
			await proformaService.cancelProforma(req.params.id as string);
			res.json({ message: 'Proforma cancelada com sucesso' });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async downloadProformaPDF(req: AuthRequest, res: Response) {
		try {
			const proforma = await proformaService.getProformaById(req.params.id as string);
			const pdfBuffer = await pdfService.generateProformaPDF(proforma);
			
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', `attachment; filename=proforma-${req.params.id}.pdf`);
			res.send(pdfBuffer);
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}
}

export const proformaController = new ProformaController();
