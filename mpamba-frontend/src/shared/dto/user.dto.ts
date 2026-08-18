import { z } from "zod";

export const UserSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("Email inválido"),
	username: z.string().min(3, "Nome de utilizador deve ter pelo menos 3 caracteres")
		.regex(/^[a-zA-Z0-9._-]+$/, "Apenas letras, números, pontos, traços e underscores")
		.optional()
		.or(z.literal("")),
	password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
	organizationId: z.string().uuid("ID de organização inválido").optional(),
	roleIds: z.array(z.string().uuid()).optional(),
	moduleCodes: z.array(z.string()).optional(),
	isActive: z.boolean().optional(),
});

export const CreateUserSchema = UserSchema;
export const UpdateUserSchema = UserSchema.partial();

export type UserDTO = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
