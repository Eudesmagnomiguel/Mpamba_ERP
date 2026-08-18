import { z } from 'zod';

// Login request schema
export const loginSchema = z.object({
	email: z.string().min(3, 'Informe o email ou nome de utilizador'),
	password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Refresh token request schema
export const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

// Registration request schema
export const registerSchema = z.object({
	orgName: z.string().min(3, 'Nome da empresa deve ter no mínimo 3 caracteres'),
	nif: z.string().min(9, 'NIF inválido').max(14, 'NIF inválido'),
	address: z.string().optional(),
	phone: z.string().optional(),
	orgEmail: z.string().email('Email da organização inválido').optional(),
	planId: z.string().uuid('ID do plano inválido'),
	adminName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
	adminEmail: z.email('Email inválido'),
	password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Activation request schema
export const activateSchema = z.object({
	code: z.string().length(8, 'Código deve ter 8 caracteres'),
});

// Activation with code request schema
export const activateWithCodeSchema = z.object({
	organizationId: z.string().uuid('ID da organização inválido'),
	code: z.string().length(8, 'Código deve ter 8 caracteres'),
});


export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ActivateInput = z.infer<typeof activateSchema>;
export type ActivateWithCodeInput = z.infer<typeof activateWithCodeSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;