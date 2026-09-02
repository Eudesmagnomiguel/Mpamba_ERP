import { z } from 'zod';

export const CreateFinancialAccountSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	type: z.enum(['CAIXA', 'BANCO']),
	currency: z.string().min(2).optional(),
	currentBalance: z.number().optional(),
	allowNegative: z.boolean().optional(),
});

export const UpdateFinancialAccountSchema = z.object({
	name: z.string().min(2).optional(),
	type: z.enum(['CAIXA', 'BANCO']).optional(),
	currency: z.string().min(2).optional(),
	allowNegative: z.boolean().optional(),
	isActive: z.boolean().optional(),
});

export const CreateFinancialCategorySchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	type: z.enum(['ENTRADA', 'SAIDA', 'TRANSFERENCIA']),
});

export const UpdateFinancialCategorySchema = z.object({
	name: z.string().min(2).optional(),
	type: z.enum(['ENTRADA', 'SAIDA', 'TRANSFERENCIA']).optional(),
	isActive: z.boolean().optional(),
});

export const CreateMovementSchema = z.object({
	accountId: z.string().min(1, 'Selecione a conta').uuid('Conta inválida'),
	type: z.enum(['ENTRADA', 'SAIDA']),
	amount: z.number().positive('Valor deve ser maior que zero'),
	date: z.string().optional(),
	description: z.string().min(2, 'Descrição é obrigatória'),
	reference: z.string().optional(),
	categoryId: z.string().uuid('Categoria inválida').optional().nullable(),
});

export const CreateTransferSchema = z.object({
	originAccountId: z.string().min(1, 'Selecione a conta de origem').uuid('Conta de origem inválida'),
	destinationAccountId: z.string().min(1, 'Selecione a conta de destino').uuid('Conta de destino inválida'),
	amount: z.number().positive('Valor deve ser maior que zero'),
	date: z.string().optional(),
	// Opcional: o backend gera uma descrição por omissão. Não pode exigir um
	// mínimo, senão o formulário bloqueia com o valor inicial vazio.
	description: z.string().optional(),
	reference: z.string().optional(),
}).refine(
	(data) => data.originAccountId !== data.destinationAccountId,
	{ message: 'As contas de origem e destino devem ser diferentes', path: ['destinationAccountId'] }
);

export const CreateCostCenterSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	code: z.string().optional(),
	description: z.string().optional(),
});

export const UpdateCostCenterSchema = CreateCostCenterSchema.partial().extend({
	isActive: z.boolean().optional(),
});

export const CreatePayableSchema = z.object({
	description: z.string().min(2, 'Descrição é obrigatória'),
	amount: z.number().positive('Valor deve ser maior que zero'),
	dueDate: z.string(),
	supplierId: z.string().uuid('Fornecedor inválido').optional().nullable(),
	categoryId: z.string().uuid('Categoria inválida').optional().nullable(),
	costCenterId: z.string().uuid('Centro de custo inválido').optional().nullable(),
	notes: z.string().optional(),
});

export const CreateReceivableSchema = z.object({
	description: z.string().min(2, 'Descrição é obrigatória'),
	amount: z.number().positive('Valor deve ser maior que zero'),
	dueDate: z.string(),
	customerId: z.string().uuid('Cliente inválido').optional().nullable(),
	invoiceId: z.string().uuid('Fatura inválida').optional().nullable(),
	categoryId: z.string().uuid('Categoria inválida').optional().nullable(),
	costCenterId: z.string().uuid('Centro de custo inválido').optional().nullable(),
	notes: z.string().optional(),
});

export const AccountListFiltersSchema = z.object({
	page: z.number().int().positive().optional(),
	pageSize: z.number().int().positive().optional(),
	search: z.string().optional(),
	type: z.enum(['CAIXA', 'BANCO']).optional(),
});

export const CategoryListFiltersSchema = z.object({
	page: z.number().int().positive().optional(),
	pageSize: z.number().int().positive().optional(),
	search: z.string().optional(),
	type: z.enum(['ENTRADA', 'SAIDA', 'TRANSFERENCIA']).optional(),
});

export const MovementListFiltersSchema = z.object({
	accountId: z.string().optional(),
	type: z.enum(['ENTRADA', 'SAIDA', 'TRANSFERENCIA']).optional(),
	categoryId: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	page: z.number().int().positive().optional(),
	pageSize: z.number().int().positive().optional(),
});

export const BankStatementLineSchema = z.object({
	date: z.string(),
	description: z.string().min(1, 'Descrição é obrigatória'),
	amount: z.number().positive('Valor deve ser positivo'),
	type: z.enum(['ENTRADA', 'SAIDA', 'TRANSFERENCIA']),
	reference: z.string().optional(),
});

export const CreateBankStatementSchema = z.object({
	accountId: z.string().uuid('Conta inválida'),
	fileName: z.string().min(1, 'Nome do extrato é obrigatório'),
	startDate: z.string(),
	endDate: z.string(),
	startingBalance: z.number(),
	endingBalance: z.number(),
	lines: z.array(BankStatementLineSchema).min(1, 'O extrato precisa de pelo menos uma linha'),
});

export const ManualMatchSchema = z.object({
	movementId: z.string().uuid('Movimento inválido'),
});

export type CreateFinancialAccountDto = z.infer<typeof CreateFinancialAccountSchema>;
export type UpdateFinancialAccountDto = z.infer<typeof UpdateFinancialAccountSchema>;
export type CreateFinancialCategoryDto = z.infer<typeof CreateFinancialCategorySchema>;
export type UpdateFinancialCategoryDto = z.infer<typeof UpdateFinancialCategorySchema>;
export type CreateMovementDto = z.infer<typeof CreateMovementSchema>;
export type CreateTransferDto = z.infer<typeof CreateTransferSchema>;
export type CreateCostCenterDto = z.infer<typeof CreateCostCenterSchema>;
export type UpdateCostCenterDto = z.infer<typeof UpdateCostCenterSchema>;
export type CreatePayableDto = z.infer<typeof CreatePayableSchema>;
export type CreateReceivableDto = z.infer<typeof CreateReceivableSchema>;

export type AccountListFiltersDto = z.infer<typeof AccountListFiltersSchema>;
export type CategoryListFiltersDto = z.infer<typeof CategoryListFiltersSchema>;
export type CreateBankStatementDto = z.infer<typeof CreateBankStatementSchema>;
export type ManualMatchDto = z.infer<typeof ManualMatchSchema>;
export type MovementListFiltersDto = z.infer<typeof MovementListFiltersSchema>;
