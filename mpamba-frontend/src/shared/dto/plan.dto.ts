import { z } from "zod";

// This schema matches the requirements of the frontend components (PlanForm, etc.)
export const PlanSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	price: z.string().min(1, "Preço é obrigatório"), // Frontend expects string like 'Kz 45,000'
	cycle: z.string().min(1, "Ciclo é obrigatório"), // Frontend uses 'cycle' instead of 'interval'
	features: z.array(z.string()).min(1, "Adicione pelo menos uma funcionalidade"),
	status: z.string().optional(),
	color: z.string().optional(),
	
	// Backend compatibility fields
	code: z.string().optional(),
	description: z.string().optional(),
	moduleIds: z.array(z.string()).optional(),
});

export const CreatePlanSchema = PlanSchema;
export const UpdatePlanSchema = PlanSchema.partial();

export type PlanDTO = z.infer<typeof PlanSchema>;
export type CreatePlanDto = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanDto = z.infer<typeof UpdatePlanSchema>;

// For backend interaction where price is numeric
export interface BackendPlan {
	id: string;
	code: string;
	name: string;
	description?: string | null;
	price: number;
	interval: string;
	createdAt: string;
	updatedAt: string;
}
