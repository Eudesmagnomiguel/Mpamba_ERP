import { z } from "zod";

export const OrganizationSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	nif: z.string().optional(),
	address: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email("Email inválido").optional().or(z.literal("")),
	planId: z.string().optional(),
	isActive: z.boolean().optional(),
});

export const CreateOrganizationSchema = OrganizationSchema;
export const UpdateOrganizationSchema = OrganizationSchema.partial();

// Parametrização — usado pelo próprio admin da organização, sem poder alterar plano/ativação
export const UpdateOwnOrganizationSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
	nif: z.string().optional(),
	address: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email("Email inválido").optional().or(z.literal("")),
	invoiceFooterNote: z.string().max(1000).optional().or(z.literal("")),
	invoiceDueDays: z.number().int().min(0).max(365).optional(),
	posInvoiceThreshold: z.number().min(0).optional(),
});

export type OrganizationDTO = z.infer<typeof OrganizationSchema>;
export type CreateOrganizationDto = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationSchema>;
export type UpdateOwnOrganizationDto = z.infer<typeof UpdateOwnOrganizationSchema>;
