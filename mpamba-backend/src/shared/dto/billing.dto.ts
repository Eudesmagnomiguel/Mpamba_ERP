import { z } from 'zod';

export const invoiceItemSchema = z.object({
	productId: z.string().uuid().optional().nullable(),
	serviceId: z.string().uuid().optional().nullable(),
	description: z.string().min(1, 'Descrição é obrigatória'),
	quantity: z.number().positive('Quantidade deve ser positiva'),
	unitPrice: z.number().min(0, 'Preço não pode ser negativo'),
	taxRate: z.number().min(0, 'Imposto não pode ser negativo').optional(),
	discount: z.number().min(0, 'Desconto não pode ser negativo').default(0),
});

export const serviceSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	description: z.string().optional(),
	price: z.number().min(0, 'Preço não pode ser negativo'),
	taxRate: z.number().min(0).max(100).default(14),
	category: z.string().optional().nullable(),
});

export const updateServiceSchema = serviceSchema.partial().extend({
	isActive: z.boolean().optional(),
});

const taxRuleShape = {
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	kind: z.enum(['TAX', 'RETENTION', 'EXEMPTION']).default('TAX'),
	scope: z.enum(['GLOBAL', 'CUSTOMER', 'CUSTOMER_CATEGORY', 'SERVICE', 'SERVICE_CATEGORY']).default('GLOBAL'),
	targetValue: z.string().optional().nullable(),
	rate: z.number().min(0, 'Taxa não pode ser negativa').max(100, 'Taxa não pode exceder 100%').default(0),
	priority: z.number().int().min(0, 'Prioridade deve ser um inteiro positivo').default(100),
	isActive: z.boolean().default(true),
};

const taxRuleBaseSchema = z.object(taxRuleShape).superRefine((data, ctx) => {
	if (data.scope !== 'GLOBAL' && !data.targetValue) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['targetValue'],
			message: 'targetValue é obrigatório para regras com escopo específico',
		});
	}
});

export const taxRuleSchema = taxRuleBaseSchema;
export const updateTaxRuleSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
	kind: z.enum(['TAX', 'RETENTION', 'EXEMPTION']).optional(),
	scope: z.enum(['GLOBAL', 'CUSTOMER', 'CUSTOMER_CATEGORY', 'SERVICE', 'SERVICE_CATEGORY']).optional(),
	targetValue: z.string().optional().nullable(),
	rate: z.number().min(0, 'Taxa não pode ser negativa').max(100, 'Taxa não pode exceder 100%').optional(),
	priority: z.number().int().min(0, 'Prioridade deve ser um inteiro positivo').optional(),
	isActive: z.boolean().optional(),
}).superRefine((data, ctx) => {
	if (data.scope && data.scope !== 'GLOBAL' && !data.targetValue) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['targetValue'],
			message: 'targetValue é obrigatório para regras com escopo específico',
		});
	}
});

export const createInvoiceSchema = z.object({
	seriesId: z.string().uuid('Série inválida'),
	customerId: z.string().uuid().optional().nullable(),
	customerName: z.string().min(1, 'Nome do cliente é obrigatório'),
	customerNif: z.string().optional().nullable(),
	customerAddress: z.string().optional().nullable(),
	currency: z.string().default('AOA'),
	notes: z.string().optional().nullable(),
	dueDate: z.coerce.date().optional(),
	items: z.array(invoiceItemSchema).min(1, 'Pelo menos um item é obrigatório'),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const cancelInvoiceSchema = z.object({
	reason: z.string().min(5, 'Motivo é obrigatório e deve ter pelo menos 5 caracteres'),
});

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;
export type InvoiceItemDto = z.infer<typeof invoiceItemSchema>;
export type CancelInvoiceDto = z.infer<typeof cancelInvoiceSchema>;
export type CreateServiceDto = z.infer<typeof serviceSchema>;
export type UpdateServiceDto = z.infer<typeof updateServiceSchema>;
export type CreateTaxRuleDto = z.infer<typeof taxRuleSchema>;
export type UpdateTaxRuleDto = z.infer<typeof updateTaxRuleSchema>;

// ─── PROFORMA ───────────────────────────────────────────────────

export const proformaItemSchema = z.object({
	serviceId: z.string().uuid().optional().nullable(),
	description: z.string().min(1, 'Descrição é obrigatória'),
	quantity: z.number().positive('Quantidade deve ser positiva'),
	unitPrice: z.number().min(0, 'Preço não pode ser negativo'),
	taxRate: z.number().min(0, 'Imposto não pode ser negativo').optional(),
	discount: z.number().min(0, 'Desconto não pode ser negativo').default(0),
});

export const createProformaSchema = z.object({
	seriesId: z.string().uuid('Série inválida'),
	customerId: z.string().uuid().optional().nullable(),
	customerName: z.string().min(1, 'Nome do cliente é obrigatório'),
	customerNif: z.string().optional().nullable(),
	customerAddress: z.string().optional().nullable(),
	currency: z.string().default('AOA'),
	notes: z.string().optional().nullable(),
	expiryDate: z.string().datetime().optional().nullable(),
	items: z.array(proformaItemSchema).min(1, 'Pelo menos um item é obrigatório'),
});

export const updateProformaSchema = createProformaSchema.partial();

export const convertProformaSchema = z.object({
	// Conversão de proforma para fatura com dados atualizados
	customerId: z.string().uuid().optional().nullable(),
	customerName: z.string().optional(),
	customerNif: z.string().optional().nullable(),
	customerAddress: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
});

export type CreateProformaDto = z.infer<typeof createProformaSchema>;
export type UpdateProformaDto = z.infer<typeof updateProformaSchema>;
export type ProformaItemDto = z.infer<typeof proformaItemSchema>;
export type ConvertProformaDto = z.infer<typeof convertProformaSchema>;

// ─── CREDIT NOTE ───────────────────────────────────────────────────

export const creditNoteItemSchema = z.object({
	description: z.string().min(1, 'Descrição é obrigatória'),
	quantity: z.number().positive('Quantidade deve ser positiva'),
	unitPrice: z.number().min(0, 'Preço não pode ser negativo'),
	discount: z.number().min(0, 'Desconto não pode ser negativo').default(0),
});

export const createCreditNoteSchema = z.object({
	invoiceId: z.string().uuid('Fatura inválida'),
	seriesId: z.string().uuid('Série inválida'),
	creditType: z.enum(['TOTAL', 'PARTIAL']).default('PARTIAL'),
	amount: z.number().positive('Montante deve ser positivo'),
	reason: z.string().min(5, 'Motivo é obrigatório'),
	items: z.array(creditNoteItemSchema).optional(),
});

export const updateCreditNoteSchema = createCreditNoteSchema.partial();

export type CreateCreditNoteDto = z.infer<typeof createCreditNoteSchema>;
export type UpdateCreditNoteDto = z.infer<typeof updateCreditNoteSchema>;
export type CreditNoteItemDto = z.infer<typeof creditNoteItemSchema>;

// ─── RECEIPT ───────────────────────────────────────────────────

export const createReceiptSchema = z.object({
	invoiceId: z.string().uuid('Fatura inválida'),
	seriesId: z.string().uuid('Série inválida'),
	amount: z.number().positive('Montante deve ser positivo'),
	paymentMethod: z.string().optional().nullable(),
	reference: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
});

export const updateReceiptSchema = createReceiptSchema.partial();

export type CreateReceiptDto = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptDto = z.infer<typeof updateReceiptSchema>;

// ─── PAYMENT STATUS ───────────────────────────────────────────────────

export const markPaymentStatusSchema = z.object({
	status: z.enum(['PENDENTE', 'PAGO', 'PARCIAL', 'VENCIDO']),
	amountPaid: z.number().min(0, 'Montante não pode ser negativo').optional(),
});

export type MarkPaymentStatusDto = z.infer<typeof markPaymentStatusSchema>;
