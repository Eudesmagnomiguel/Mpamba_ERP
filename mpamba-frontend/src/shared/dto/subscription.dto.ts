import { z } from "zod";

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export const SubscriptionStatusEnum = z.enum([
	"ACTIVE",
	"SUSPENDED",
	"CANCELLED",
	"PAST_DUE",
	"TRIAL",
]);

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;

// ─────────────────────────────────────────────
// User – Resgatar código de ativação
// POST /subscription/redeem
// ─────────────────────────────────────────────

export const RedeemCodeSchema = z.object({
	code: z
		.string()
		.min(8, "O código deve ter pelo menos 8 caracteres")
		.max(8, "O código deve ter exatamente 8 caracteres")
		.toUpperCase(),
});

export type RedeemCodeDto = z.infer<typeof RedeemCodeSchema>;

// ─────────────────────────────────────────────
// Admin – Suspender subscrição
// POST /subscription/admin/:organizationId/suspend
// ─────────────────────────────────────────────

export const SuspendSubscriptionSchema = z.object({
	reason: z.string().optional(),
});

export type SuspendSubscriptionDto = z.infer<typeof SuspendSubscriptionSchema>;

// ─────────────────────────────────────────────
// Admin – Estender subscrição
// POST /subscription/admin/:organizationId/extend
// ─────────────────────────────────────────────

export const ExtendSubscriptionSchema = z.object({
	months: z
		.number()
		.int("Deve ser um número inteiro")
		.min(1, "Deve ser pelo menos 1 mês")
		.max(60, "Máximo de 60 meses"),
});

export type ExtendSubscriptionDto = z.infer<typeof ExtendSubscriptionSchema>;

// ─────────────────────────────────────────────
// Admin – Mudar plano
// POST /subscription/admin/:organizationId/change-plan
// ─────────────────────────────────────────────

export const ChangeSubscriptionPlanSchema = z.object({
	planId: z.string().uuid("ID de plano inválido"),
});

export type ChangeSubscriptionPlanDto = z.infer<
	typeof ChangeSubscriptionPlanSchema
>;

// ─────────────────────────────────────────────
// Admin – Cancelar subscrição
// POST /subscription/admin/:organizationId/cancel
// ─────────────────────────────────────────────

export const CancelSubscriptionSchema = z.object({
	reason: z.string().optional(),
});

export type CancelSubscriptionDto = z.infer<typeof CancelSubscriptionSchema>;

// ─────────────────────────────────────────────
// Admin – Filtros de listagem
// GET /subscription/admin
// ─────────────────────────────────────────────

export const SubscriptionListFiltersSchema = z.object({
	page: z.number().int().min(1).optional(),
	pageSize: z.number().int().min(1).max(100).optional(),
	status: SubscriptionStatusEnum.optional(),
	organizationName: z.string().optional(),
});

export type SubscriptionListFiltersDto = z.infer<
	typeof SubscriptionListFiltersSchema
>;
