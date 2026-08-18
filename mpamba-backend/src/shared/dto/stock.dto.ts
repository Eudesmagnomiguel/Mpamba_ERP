import { z } from 'zod';

// ─── Product ────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	sku: z.string().min(1, 'SKU é obrigatório'),
	unit: z.string().min(1, 'Unidade é obrigatória'), // un, kg, caixa, etc.
	description: z.string().optional(),
	price: z.number().min(0).optional(),
	quantity: z.number().min(0).optional(),
	minStock: z.number().min(0).optional(),
	maxStock: z.number().min(0).optional(),
	categoryId: z.string().uuid().optional(),
}).refine(
	(data) => data.maxStock === undefined || data.minStock === undefined || data.maxStock >= data.minStock,
	{ message: 'Stock máximo não pode ser menor que o stock mínimo', path: ['maxStock'] }
).refine(
	(data) => data.maxStock === undefined || data.quantity === undefined || data.quantity <= data.maxStock,
	{ message: 'Quantidade inicial não pode exceder o stock máximo', path: ['quantity'] }
);

export const updateProductSchema = z.object({
	name: z.string().min(2).optional(),
	sku: z.string().min(1).optional(),
	unit: z.string().min(1).optional(),
	description: z.string().optional(),
	price: z.number().min(0).optional(),
	minStock: z.number().min(0).optional(),
	maxStock: z.number().min(0).optional(),
	isActive: z.boolean().optional(),
	categoryId: z.string().uuid().optional(),
}).refine(
	(data) => data.maxStock === undefined || data.minStock === undefined || data.maxStock >= data.minStock,
	{ message: 'Stock máximo não pode ser menor que o stock mínimo', path: ['maxStock'] }
);

// ─── Categories ─────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	description: z.string().optional(),
});

export const updateCategorySchema = z.object({
	name: z.string().min(2).optional(),
	description: z.string().optional(),
	isActive: z.boolean().optional(),
});

// ─── Suppliers ──────────────────────────────────────────────────────────────

export const createSupplierSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	nif: z.string().optional(),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	phone: z.string().optional(),
	address: z.string().optional(),
});

export const updateSupplierSchema = z.object({
	name: z.string().min(2).optional(),
	nif: z.string().optional(),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	phone: z.string().optional(),
	address: z.string().optional(),
	isActive: z.boolean().optional(),
});

// ─── Movements ──────────────────────────────────────────────────────────────

export const addStockSchema = z.object({
	quantity: z.number().positive('Quantidade deve ser maior que 0'),
	reference: z.string().optional(),
	reason: z.string().optional(),
	supplierId: z.string().uuid().optional(),
});

export const removeStockSchema = z.object({
	quantity: z.number().positive('Quantidade deve ser maior que 0'),
	reference: z.string().optional(),
	reason: z.string().optional(),
});

export const adjustStockSchema = z.object({
	quantity: z.number().refine(v => v !== 0, 'Quantidade não pode ser zero'),
	reason: z.string().min(5, 'Justificativa é obrigatória e deve ter pelo menos 5 caracteres'),
	reference: z.string().optional(),
});

export const reversalSchema = z.object({
	reason: z.string().min(5, 'Justificativa de reversão é obrigatória e deve ter pelo menos 5 caracteres'),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierDto = z.infer<typeof updateSupplierSchema>;
export type AddStockDto = z.infer<typeof addStockSchema>;
export type RemoveStockDto = z.infer<typeof removeStockSchema>;
export type AdjustStockDto = z.infer<typeof adjustStockSchema>;
export type ReversalDto = z.infer<typeof reversalSchema>;
