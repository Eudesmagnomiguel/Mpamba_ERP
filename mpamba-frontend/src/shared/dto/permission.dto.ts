import { z } from "zod";

export const PermissionSchema = z.object({
	code: z.string().min(2, "Código deve ter pelo menos 2 caracteres"),
	description: z.string().optional(),
});

export const CreatePermissionSchema = PermissionSchema;

export type PermissionDTO = z.infer<typeof PermissionSchema>;
export type CreatePermissionDto = z.infer<typeof CreatePermissionSchema>;
