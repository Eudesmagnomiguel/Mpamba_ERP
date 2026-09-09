import { z } from 'zod';

/**
 * Validade do produto. `null` (ou '', o que um input de data vazio devolve)
 * significa «sem validade» e limpa uma validade já definida.
 *
 * Sem `.transform()` de propósito: transformar faria o tipo de entrada diferir
 * do de saída, e o zodResolver do react-hook-form deixaria de casar com o
 * tipo do formulário.
 */
const optionalExpiryDate = z
	.string()
	.refine((value) => value === '' || !Number.isNaN(Date.parse(value)), 'Data de validade inválida')
	.nullable()
	.optional();

export const CreateProductSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	sku: z.string().min(1, 'SKU é obrigatório'),
	unit: z.string().min(1, 'Unidade é obrigatória'),
	description: z.string().optional(),
	price: z.number().min(0).optional(),
	quantity: z.number().min(0).optional(),
	minStock: z.number().min(0).optional(),
	maxStock: z.number().min(0).optional(),
	expiryDate: optionalExpiryDate,
	categoryId: z.string().uuid('Categoria inválida').optional().nullable(),
}).refine(
	(data) => data.maxStock === undefined || data.minStock === undefined || data.maxStock >= data.minStock,
	{ message: 'Stock máximo não pode ser menor que o stock mínimo', path: ['maxStock'] }
).refine(
	(data) => data.maxStock === undefined || data.quantity === undefined || data.quantity <= data.maxStock,
	{ message: 'Quantidade inicial não pode exceder o stock máximo', path: ['quantity'] }
);

export const UpdateProductSchema = z.object({
	name: z.string().min(2).optional(),
	sku: z.string().min(1).optional(),
	unit: z.string().min(1).optional(),
	description: z.string().optional(),
	price: z.number().min(0).optional(),
	minStock: z.number().min(0).optional(),
	maxStock: z.number().min(0).optional(),
	expiryDate: optionalExpiryDate,
	categoryId: z.string().uuid('Categoria inválida').optional().nullable(),
	isActive: z.boolean().optional(),
}).refine(
	(data) => data.maxStock === undefined || data.minStock === undefined || data.maxStock >= data.minStock,
	{ message: 'Stock máximo não pode ser menor que o stock mínimo', path: ['maxStock'] }
);

export const AddStockSchema = z.object({
	quantity: z.number().positive('Quantidade deve ser maior que 0'),
	reference: z.string().optional(),
	reason: z.string().optional(),
	supplierId: z.string().uuid('Fornecedor inválido').optional().nullable(),
});

export const RemoveStockSchema = z.object({
	quantity: z.number().positive('Quantidade deve ser maior que 0'),
	reference: z.string().optional(),
	reason: z.string().optional(),
});

export const AdjustStockSchema = z.object({
	quantity: z.number().refine(value => value !== 0, 'Quantidade não pode ser zero'),
	reason: z.string().min(5, 'Justificativa é obrigatória e deve ter pelo menos 5 caracteres'),
	reference: z.string().optional(),
});

export const ReversalSchema = z.object({
	reason: z.string().min(5, 'Justificativa de reversão é obrigatória e deve ter pelo menos 5 caracteres'),
});

export const CreateCategorySchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	description: z.string().optional(),
});

export const UpdateCategorySchema = z.object({
	name: z.string().min(2).optional(),
	description: z.string().optional(),
});

export const CreateSupplierSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	nif: z.string().optional(),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	phone: z.string().optional(),
	address: z.string().optional(),
});

export const UpdateSupplierSchema = z.object({
	name: z.string().min(2).optional(),
	nif: z.string().optional(),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	phone: z.string().optional(),
	address: z.string().optional(),
});

export const StockCategoryListFiltersSchema = z.object({
	page: z.number().int().positive().optional(),
	pageSize: z.number().int().positive().optional(),
	search: z.string().optional(),
});

export const StockSupplierListFiltersSchema = z.object({
	page: z.number().int().positive().optional(),
	pageSize: z.number().int().positive().optional(),
	search: z.string().optional(),
});

export const StockProductListFiltersSchema = z.object({
	page: z.number().int().positive().optional(),
	pageSize: z.number().int().positive().optional(),
	search: z.string().optional(),
});

export const StockMovementListFiltersSchema = z.object({
	productId: z.string().optional(),
	type: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE']).optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	page: z.number().int().positive().optional(),
	pageSize: z.number().int().positive().optional(),
});

export const StockMostUsedFiltersSchema = z.object({
	limit: z.number().int().positive().optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
export type AddStockDto = z.infer<typeof AddStockSchema>;
export type RemoveStockDto = z.infer<typeof RemoveStockSchema>;
export type AdjustStockDto = z.infer<typeof AdjustStockSchema>;
export type ReversalDto = z.infer<typeof ReversalSchema>;
export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
export type CreateSupplierDto = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierDto = z.infer<typeof UpdateSupplierSchema>;
export type StockCategoryListFiltersDto = z.infer<typeof StockCategoryListFiltersSchema>;
export type StockSupplierListFiltersDto = z.infer<typeof StockSupplierListFiltersSchema>;
export type StockProductListFiltersDto = z.infer<typeof StockProductListFiltersSchema>;
export type StockMovementListFiltersDto = z.infer<typeof StockMovementListFiltersSchema>;
export type StockMostUsedFiltersDto = z.infer<typeof StockMostUsedFiltersSchema>;