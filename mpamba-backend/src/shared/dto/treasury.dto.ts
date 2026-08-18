import { z } from 'zod';

export const createAccountSchema = z.object({
	name: z.string().min(1, 'Nome da conta é obrigatório'),
	type: z.enum(['CAIXA', 'BANCO']),
	currency: z.string().default('AOA'),
	allowNegative: z.boolean().default(false),
});

export const addMovementSchema = z.object({
	accountId: z.string().min(1, 'Conta é obrigatória'),
	amount: z.number().positive('Valor deve ser positivo'),
	categoryId: z.string().min(1, 'Categoria é obrigatória'),
	description: z.string().min(1, 'Descrição é obrigatória'),
	reference: z.string().optional(),
	date: z.date().optional(),
});

export const transferSchema = z.object({
	fromAccountId: z.string().min(1, 'Conta de origem é obrigatória'),
	toAccountId: z.string().min(1, 'Conta de destino é obrigatória'),
	amount: z.number().positive('Valor deve ser positivo'),
	description: z.string().optional(),
});

export const createCategorySchema = z.object({
	name: z.string().min(1, 'Nome da categoria é obrigatório'),
	type: z.enum(['ENTRADA', 'SAIDA']),
});

export const openCashSessionSchema = z.object({
	financialAccountId: z.string().min(1, 'Conta é obrigatória'),
	openingBalance: z.number().min(0, 'Valor de abertura não pode ser negativo'),
	notes: z.string().optional(),
});

export const closeCashSessionSchema = z.object({
	actualClosingBalance: z.number().min(0, 'Valor de fecho não pode ser negativo'),
	notes: z.string().optional(),
});

export const bankStatementLineSchema = z.object({
	date: z.coerce.date(),
	description: z.string().min(1, 'Descrição é obrigatória'),
	amount: z.number().positive('Valor deve ser positivo'),
	type: z.enum(['ENTRADA', 'SAIDA', 'TRANSFERENCIA']),
	reference: z.string().optional(),
});

export const createBankStatementSchema = z.object({
	accountId: z.string().min(1, 'Conta é obrigatória'),
	fileName: z.string().min(1, 'Nome do extrato é obrigatório'),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	startingBalance: z.number(),
	endingBalance: z.number(),
	lines: z.array(bankStatementLineSchema).min(1, 'O extrato precisa de pelo menos uma linha'),
});

export const manualMatchSchema = z.object({
	movementId: z.string().min(1, 'Movimento é obrigatório'),
});

export type CreateAccountDto = z.infer<typeof createAccountSchema>;
export type AddMovementDto = z.infer<typeof addMovementSchema>;
export type TransferDto = z.infer<typeof transferSchema>;
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type OpenCashSessionDto = z.infer<typeof openCashSessionSchema>;
export type CloseCashSessionDto = z.infer<typeof closeCashSessionSchema>;
export type CreateBankStatementDto = z.infer<typeof createBankStatementSchema>;
export type ManualMatchDto = z.infer<typeof manualMatchSchema>;
