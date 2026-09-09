import { z } from 'zod';

export const accountSideSchema = z.enum(['ATIVO', 'PASSIVO', 'CAPITAL_PROPRIO', 'CUSTO', 'PROVEITO']);

// Numeração do PGC-Angola: classe 1 a 8, sub-contas separadas por ponto
// (43, 43.1, 34.5.3). A classe é sempre o primeiro dígito do código.
export const ACCOUNT_CODE_PATTERN = /^[1-8]\d(\.\d{1,2})*$/;

export const createAccountSchema = z
	.object({
		code: z
			.string()
			.regex(ACCOUNT_CODE_PATTERN, 'Use a numeração do PGC (ex.: 43, 43.1, 34.5.3), começando pela classe 1 a 8'),
		name: z.string().min(1, 'Nome é obrigatório'),
		class: z.number().int().min(1).max(8),
		side: accountSideSchema,
		parentId: z.string().uuid().optional().nullable(),
	})
	.refine((data) => data.class === Number(data.code[0]), {
		message: 'A classe tem de corresponder ao primeiro dígito do código',
		path: ['class'],
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
