import { z } from "zod";

export const ModuleSchema = z.object({
	code: z.string().min(2, "Código deve ter pelo menos 2 caracteres"),
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	description: z.string().optional(),
});

export const CreateModuleSchema = ModuleSchema;
export const UpdateModuleSchema = ModuleSchema.partial();

export type ModuleDTO = z.infer<typeof ModuleSchema>;
export type CreateModuleDto = z.infer<typeof CreateModuleSchema>;
export type UpdateModuleDto = z.infer<typeof UpdateModuleSchema>;
