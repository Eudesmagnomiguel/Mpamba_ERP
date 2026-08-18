import { z } from 'zod';

export const accountSideSchema = z.enum(['ATIVO', 'PASSIVO', 'CAPITAL_PROPRIO', 'CUSTO', 'PROVEITO']);

export const createAccountSchema = z.object({
	code: z.string().min(1, 'Código é obrigatório'),
	name: z.string().min(1, 'Nome é obrigatório'),
	class: z.number().int().min(1).max(8),
	side: accountSideSchema,
	parentId: z.string().uuid().optional().nullable(),
});

export const updateAccountSchema = z.object({
	name: z.string().min(1).optional(),
	isActive: z.boolean().optional(),
});

export const journalEntryLineSchema = z.object({
	accountId: z.string().uuid('Conta inválida'),
	debit: z.number().min(0).default(0),
	credit: z.number().min(0).default(0),
	description: z.string().optional(),
});

export const createManualEntrySchema = z.object({
	date: z.coerce.date().optional(),
	description: z.string().min(1, 'Descrição é obrigatória'),
	lines: z.array(journalEntryLineSchema).min(2, 'São necessárias pelo menos duas linhas'),
});

export const reverseEntrySchema = z.object({
	reason: z.string().optional(),
});

export type CreateAccountDto = z.infer<typeof createAccountSchema>;
export type UpdateAccountDto = z.infer<typeof updateAccountSchema>;
export type CreateManualEntryDto = z.infer<typeof createManualEntrySchema>;
export type ReverseEntryDto = z.infer<typeof reverseEntrySchema>;
