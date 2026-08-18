import { z } from "zod";

export const createModuleSchema = z.object({
	code: z.string().min(2),
	name: z.string().min(2),
	description: z.string().optional(),
});

export const updateModuleSchema = z.object({
	code: z.string().min(2).optional(),
	name: z.string().min(2).optional(),
	description: z.string().optional(),
});

export type CreateModuleDto = z.infer<typeof createModuleSchema>;
export type UpdateModuleDto = z.infer<typeof updateModuleSchema>;
