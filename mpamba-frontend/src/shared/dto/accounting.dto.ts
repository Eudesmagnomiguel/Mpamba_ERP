import { z } from 'zod';

export const AccountSideSchema = z.enum(['ATIVO', 'PASSIVO', 'CAPITAL_PROPRIO', 'CUSTO', 'PROVEITO']);

export const CreateAccountingAccountSchema = z.object({
	code: z.string().min(1, 'Código é obrigatório'),
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	class: z.number().int().min(1).max(8),
	side: AccountSideSchema,
	parentId: z.string().uuid().optional().nullable(),
});

export const UpdateAccountingAccountSchema = z.object({
	name: z.string().min(2).optional(),
	isActive: z.boolean().optional(),
});

export const JournalEntryLineSchema = z.object({
	accountId: z.string().uuid('Conta inválida'),
	debit: z.number().min(0).optional(),
	credit: z.number().min(0).optional(),
	description: z.string().optional(),
});

export const CreateManualEntrySchema = z.object({
	date: z.string().optional(),
	description: z.string().min(2, 'Descrição é obrigatória'),
	lines: z.array(JournalEntryLineSchema).min(2, 'São necessárias pelo menos duas linhas'),
});

export const ReverseEntrySchema = z.object({
	reason: z.string().optional(),
});

export type CreateAccountingAccountDto = z.infer<typeof CreateAccountingAccountSchema>;
export type UpdateAccountingAccountDto = z.infer<typeof UpdateAccountingAccountSchema>;
export type CreateManualEntryDto = z.infer<typeof CreateManualEntrySchema>;
export type ReverseEntryDto = z.infer<typeof ReverseEntrySchema>;
