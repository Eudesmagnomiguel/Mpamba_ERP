import { z } from "zod";
import { AuthUser } from "../types/auth.types";

// Auth Schemas
export const SignInDTO = z.object({
	email: z.string().min(3, "Informe o email ou nome de utilizador"),
	password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export const ForgotPasswordDTO = z.object({
	email: z.string().email("Email inválido"),
});

export const ResetPasswordDTO = z.object({
	token: z.string().min(1, "Token inválido"),
	password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export const RegisterDTO = z.object({
	orgName: z.string().min(2, "Nome da organização inválido"),
	nif: z.string().min(5, "NIF inválido"),
	adminName: z.string().min(2, "Nome do administrador inválido"),
	adminEmail: z.string().email("Email inválido"),
	password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
	address: z.string().optional(),
	phone: z.string().optional(),
	orgEmail: z.string().email("Email da organização inválido").optional().or(z.literal("")),
	planId: z.string().uuid('ID do plano inválido'),
});

export const UpdateProfileDTO = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
	email: z.string().email("Email inválido").optional(),
	username: z.string().min(3, "Nome de utilizador deve ter pelo menos 3 caracteres")
		.regex(/^[a-zA-Z0-9._-]+$/, "Apenas letras, números, pontos, traços e underscores")
		.optional()
		.or(z.literal("")),
	currentPassword: z.string().optional().or(z.literal("")),
	newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
}).refine(
	(data) => !data.newPassword || !!data.currentPassword,
	{ message: "Informe a palavra-passe atual para definir uma nova", path: ["currentPassword"] }
);

export const ActivateDTO = z.object({
	organizationId: z.string().uuid("ID de organização inválido"),
});

export const ActivateWithCodeDTO = z.object({
	organizationId: z.string().uuid("ID de organização inválido"),
	code: z.string().length(8, "O código deve ter 8 caracteres").toUpperCase(),
});

// Types inferred from schemas
export type SignInDTOType = z.infer<typeof SignInDTO>;
export type ForgotPasswordDTOType = z.infer<typeof ForgotPasswordDTO>;
export type ResetPasswordDTOType = z.infer<typeof ResetPasswordDTO>;
export type RegisterDTOType = z.infer<typeof RegisterDTO>;
export type ActivateDTOType = z.infer<typeof ActivateDTO>;
export type UpdateProfileDTOType = z.infer<typeof UpdateProfileDTO>;
export type ActivateWithCodeDTOType = z.infer<typeof ActivateWithCodeDTO>;

// Response interfaces
export interface LoginResponse {
	accessToken: string;
	refreshToken: string;
	user: AuthUser;
}

export interface RefreshTokenResponse {
	accessToken: string;
}

export interface UpdateProfileResponse {
	id: string;
	name: string;
	email: string;
	username?: string | null;
	urlImageProfile?: string | null;
	isActive: boolean;
	organizationId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface RegisterResponse {
	message: string;
	data?: {
		organizationId: string;
		whatsappLink: string;
	}
}

// Backward compatibility or generic names
export type LoginDto = SignInDTOType;
export type RegisterDto = RegisterDTOType;
export type RefreshTokenDto = { refreshToken: string };
export type ActivateDto = ActivateDTOType;
export type ActivateWithCodeDto = ActivateWithCodeDTOType;