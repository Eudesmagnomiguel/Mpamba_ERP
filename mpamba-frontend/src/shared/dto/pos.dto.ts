export type PosPaymentMethod = 'CASH' | 'MULTICAIXA' | 'TRANSFER' | 'DEPOSIT';

export interface PosCheckoutItemDto {
	productId: string;
	quantity: number;
}

export interface PosCheckoutDto {
	customerId?: string;
	customerName?: string;
	paymentMethod: PosPaymentMethod;
	items: PosCheckoutItemDto[];
}

export interface PosCheckoutResult {
	invoice: { id: string; number: string; total: number };
	receipt: { id: string; number: string; amount: number };
	recommendedDocument: 'INVOICE' | 'RECEIPT';
}
