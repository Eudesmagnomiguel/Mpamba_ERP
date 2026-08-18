import { z } from 'zod';

export const CreateCustomerSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	nif: z.string().optional().nullable(),
	email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
	phone: z.string().optional().nullable(),
	address: z.string().optional().nullable(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial().extend({
	isActive: z.boolean().optional(),
});

export const CreateInvoiceItemSchema = z.object({
	productId: z.string().uuid().optional().nullable(),
	serviceId: z.string().uuid().optional().nullable(),
	description: z.string().min(1, 'Descrição é obrigatória'),
	quantity: z.number().positive('Quantidade deve ser positiva'),
	unitPrice: z.number().nonnegative('Preço unitário não pode ser negativo'),
	taxRate: z.number().min(0).max(100).optional(),
	discount: z.number().nonnegative(),
});

export const CreateInvoiceSchema = z.object({
	seriesId: z.string().uuid('Série inválida'),
	customerId: z.string().uuid().optional().nullable(),
	customerName: z.string().min(2, 'Nome do cliente é obrigatório'),
	customerNif: z.string().optional().nullable(),
	customerAddress: z.string().optional().nullable(),
	currency: z.string(),
	notes: z.string().optional().nullable(),
	items: z.array(CreateInvoiceItemSchema).min(1, 'Pelo menos um item é necessário'),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

export const CancelInvoiceSchema = z.object({
	reason: z.string().min(5, 'Justificativa deve ter pelo menos 5 caracteres'),
});

export const CreateServiceSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	description: z.string().optional().nullable(),
	price: z.number().nonnegative('Preço não pode ser negativo'),
	taxRate: z.number().min(0).max(100),
	category: z.string().optional().nullable(),
});

export const UpdateServiceSchema = CreateServiceSchema.partial().extend({
	isActive: z.boolean().optional(),
});

export const TaxRuleSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	kind: z.enum(['TAX', 'RETENTION', 'EXEMPTION']),
	scope: z.enum(['GLOBAL', 'CUSTOMER', 'CUSTOMER_CATEGORY', 'SERVICE', 'SERVICE_CATEGORY']),
	targetValue: z.string().optional().nullable(),
	rate: z.number().min(0).max(100),
	priority: z.number().int().min(0),
	isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
	if (data.scope !== 'GLOBAL' && !data.targetValue) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['targetValue'],
			message: 'Target value é obrigatório para escopos específicos',
		});
	}
});

export const UpdateTaxRuleSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
	kind: z.enum(['TAX', 'RETENTION', 'EXEMPTION']).optional(),
	scope: z.enum(['GLOBAL', 'CUSTOMER', 'CUSTOMER_CATEGORY', 'SERVICE', 'SERVICE_CATEGORY']).optional(),
	targetValue: z.string().optional().nullable(),
	rate: z.number().min(0).max(100).optional(),
	priority: z.number().int().min(0).optional(),
	isActive: z.boolean().optional(),
}).superRefine((data, ctx) => {
	if (data.scope && data.scope !== 'GLOBAL' && !data.targetValue) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['targetValue'],
			message: 'Target value é obrigatório para escopos específicos',
		});
	}
});

export type CreateCustomerDto = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof UpdateCustomerSchema>;
export type CreateInvoiceDto = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceDto = z.infer<typeof UpdateInvoiceSchema>;
export type CancelInvoiceDto = z.infer<typeof CancelInvoiceSchema>;
export type CreateServiceDto = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceDto = z.infer<typeof UpdateServiceSchema>;
export type CreateTaxRuleDto = z.infer<typeof TaxRuleSchema>;
export type UpdateTaxRuleDto = z.infer<typeof UpdateTaxRuleSchema>;

// --- Proformas ---
export const CreateProformaSchema = z.object({
	seriesId: z.string().uuid('Série inválida'),
	customerId: z.string().uuid().optional().nullable(),
	customerName: z.string().min(1, 'Nome do cliente é obrigatório'),
	customerNif: z.string().optional().nullable(),
	customerAddress: z.string().optional().nullable(),
	currency: z.string(),
	notes: z.string().optional().nullable(),
	expiryDate: z.string().optional().nullable(),
	items: z.array(CreateInvoiceItemSchema).min(1, 'Pelo menos um item é obrigatório'),
});

export type CreateProformaDto = z.infer<typeof CreateProformaSchema>;

// --- Credit Notes ---
export const CreateCreditNoteSchema = z.object({
	invoiceId: z.string().uuid('Fatura inválida'),
	seriesId: z.string().uuid('Série inválida'),
	creditType: z.enum(['TOTAL', 'PARTIAL']),
	amount: z.number().positive('Montante deve ser positivo'),
	reason: z.string().min(5, 'Motivo é obrigatório'),
});

export type CreateCreditNoteDto = z.infer<typeof CreateCreditNoteSchema>;

// --- Receipts ---
export const CreateReceiptSchema = z.object({
	invoiceId: z.string().uuid('Fatura inválida'),
	seriesId: z.string().uuid('Série inválida'),
	amount: z.number().positive('Montante deve ser positivo'),
	paymentMethod: z.string().optional().nullable(),
	reference: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
});

export type CreateReceiptDto = z.infer<typeof CreateReceiptSchema>;

// --- Payment Status ---
export const MarkPaymentStatusSchema = z.object({
	status: z.enum(['PENDENTE', 'PAGO', 'PARCIAL', 'VENCIDO']),
	amountPaid: z.number().min(0, 'Montante não pode ser negativo').optional(),
});

export type MarkPaymentStatusDto = z.infer<typeof MarkPaymentStatusSchema>;
 
 // --- Series ---
 export const CreateSeriesSchema = z.object({
     prefix: z.string().min(1, 'Prefixo é obrigatório'),
     year: z.number().int().min(2000, 'Ano inválido'),
     nextSequence: z.number().int().min(1, 'Sequência deve começar em pelo menos 1'),
     isActive: z.boolean(),
 });
 
 export const UpdateSeriesSchema = CreateSeriesSchema.partial();
 
 export type CreateSeriesDto = z.infer<typeof CreateSeriesSchema>;
 export type UpdateSeriesDto = z.infer<typeof UpdateSeriesSchema>;
