import { z } from "zod";

export const RoleSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	description: z.string().optional(),
	organizationId: z.string().uuid("ID de organização inválido").optional(),
	moduleId: z.string().uuid().optional(),
	permissionIds: z.array(z.string()).optional(),
});

export const CreateRoleSchema = RoleSchema;
export const UpdateRoleSchema = RoleSchema.partial();

export type RoleDTO = z.infer<typeof RoleSchema>;
export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;
