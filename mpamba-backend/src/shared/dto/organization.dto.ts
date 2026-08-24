import { z } from "zod";

export const createOrganizationSchema = z.object({
	name: z.string().min(2),
	nif: z.string().optional(),
	address: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional().or(z.literal('')),
	planId: z.string().optional(),
	isActive: z.boolean().optional(),
});

export const updateOrganizationSchema = z.object({
	name: z.string().min(2).optional(),
	nif: z.string().optional(),
	address: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional().or(z.literal('')),
	planId: z.string().optional(),
	isActive: z.boolean().optional(),
});

// Parametrização — usado pelo próprio admin da organização, sem poder alterar plano/ativação
export const updateOwnOrganizationSchema = z.object({
	name: z.string().min(2).optional(),
	nif: z.string().optional(),
	address: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional().or(z.literal('')),
	invoiceFooterNote: z.string().max(1000).optional().or(z.literal('')),
	invoiceDueDays: z.number().int().min(0).max(365).optional(),
	posInvoiceThreshold: z.number().min(0).optional(),
	// Dados de emitente impressos na factura (formato AGT)
	city: z.string().max(80).optional().or(z.literal('')),
	postalCode: z.string().max(20).optional().or(z.literal('')),
	country: z.string().max(60).optional().or(z.literal('')),
	fax: z.string().max(40).optional().or(z.literal('')),
	logoUrl: z.string().max(500).optional().or(z.literal('')),
	// Coordenadas bancárias do rodapé
	bankName: z.string().max(80).optional().or(z.literal('')),
	bankAccount: z.string().max(60).optional().or(z.literal('')),
	iban: z.string().max(60).optional().or(z.literal('')),
	// Menção legal e parametrização fiscal
	agtValidationNumber: z.string().max(40).optional().or(z.literal('')),
	taxExemptionCode: z.string().max(10).optional().or(z.literal('')),
	taxExemptionReason: z.string().max(120).optional().or(z.literal('')),
	retentionEntity: z.string().max(120).optional().or(z.literal('')),
	retentionRate: z.number().min(0).max(100).optional(),
});

// Logótipo: aceita um URL http(s) ou a própria imagem como data URI. O limite
// de 1,5 MB em base64 corresponde a cerca de 1 MB de imagem original, folgado
// para um logótipo e seguro para guardar em coluna de texto.
export const updateOrganizationLogoSchema = z.object({
	logo: z
		.string()
		.min(1, 'Logótipo é obrigatório')
		.max(1_500_000, 'Imagem demasiado grande — use um ficheiro até 1 MB')
		.refine(
			(v) => /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(v) || /^https?:\/\//i.test(v),
			'Indique um URL http(s) ou uma imagem PNG, JPG, GIF ou WebP',
		),
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
export type UpdateOwnOrganizationDto = z.infer<typeof updateOwnOrganizationSchema>;
export type UpdateOrganizationLogoDto = z.infer<typeof updateOrganizationLogoSchema>;