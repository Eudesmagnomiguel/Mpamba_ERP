import { z } from 'zod';

export const posCheckoutItemSchema = z.object({
	productId: z.string().uuid('Produto inválido'),
	quantity: z.number().positive('Quantidade deve ser positiva'),
});

export const posCheckoutSchema = z.object({
	customerId: z.string().uuid().optional().nullable(),
	customerName: z.string().optional(),
	paymentMethod: z.enum(['CASH', 'MULTICAIXA', 'TRANSFER', 'DEPOSIT']),
	items: z.array(posCheckoutItemSchema).min(1, 'Adicione pelo menos um produto ao carrinho'),
});

export type PosCheckoutDto = z.infer<typeof posCheckoutSchema>;
