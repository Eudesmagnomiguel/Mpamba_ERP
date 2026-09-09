import { z } from 'zod';

export const AccountSideSchema = z.enum(['ATIVO', 'PASSIVO', 'CAPITAL_PROPRIO', 'CUSTO', 'PROVEITO']);

// Numeração do PGC-Angola: classe 1 a 8, sub-contas separadas por ponto
// (43, 43.1, 34.5.3). A classe é sempre o primeiro dígito do código.
export const ACCOUNT_CODE_PATTERN = /^[1-8]\d(\.\d{1,2})*$/;

export const CreateAccountingAccountSchema = z
	.object({
		code: z
			.string()
			.regex(ACCOUNT_CODE_PATTERN, 'Use a numeração do PGC (ex.: 43, 43.1, 34.5.3), começando pela classe 1 a 8'),
		name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
		class: z.number().int().min(1).max(8),
		side: AccountSideSchema,
		parentId: z.string().uuid().optional().nullable(),
	})
	.refine((data) => data.class === Number(data.code[0]), {
		message: 'A classe tem de corresponder ao primeiro dígito do código',
		path: ['class'],
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
