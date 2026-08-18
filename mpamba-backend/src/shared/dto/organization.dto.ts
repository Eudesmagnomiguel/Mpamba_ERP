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
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
export type UpdateOwnOrganizationDto = z.infer<typeof updateOwnOrganizationSchema>;