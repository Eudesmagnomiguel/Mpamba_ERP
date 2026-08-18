import { z } from "zod";

export const createUserSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	username: z.string().min(3).regex(/^[a-zA-Z0-9._-]+$/, 'Apenas letras, números, pontos, traços e underscores').optional(),
	password: z.string().min(6),
	organizationId: z.string().uuid().optional(),
	roleIds: z.array(z.string().uuid()).optional(),
	isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
	name: z.string().min(2).optional(),
	email: z.string().email().optional(),
	username: z.string().min(3).regex(/^[a-zA-Z0-9._-]+$/, 'Apenas letras, números, pontos, traços e underscores').optional(),
	password: z.string().min(6).optional(),
	organizationId: z.string().uuid().optional(),
	roleIds: z.array(z.string().uuid()).optional(),
	isActive: z.boolean().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
