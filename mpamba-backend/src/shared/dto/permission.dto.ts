import { z } from "zod";

export const createPermissionSchema = z.object({
	code: z.string().min(2),
	description: z.string().optional(),
});

export type CreatePermissionDto = z.infer<typeof createPermissionSchema>;