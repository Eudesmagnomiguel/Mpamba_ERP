import { z } from "zod";

export const createRoleSchema = z.object({
	name: z.string().min(2),
	description: z.string().optional(),
	organizationId: z.string().uuid().optional(),
	moduleId: z.string().uuid().optional(),
	permissionIds: z.array(z.string()).optional(),
});

export const updateRoleSchema = z.object({
	name: z.string().min(2).optional(),
	description: z.string().optional(),
	moduleId: z.string().uuid().optional(),
	permissionIds: z.array(z.string()).optional(),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
