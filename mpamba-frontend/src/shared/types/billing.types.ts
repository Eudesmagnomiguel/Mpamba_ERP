import type { PaginationMeta } from './pagination.types';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';

export interface Customer {
	id: string;
	name: string;
	nif?: string | null;
	email?: string | null;
	phone?: string | null;
	address?: string | null;
	category?: string | null;
	isActive: boolean;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface InvoiceSeries {
	id: string;
	prefix: string;
	year: number;
	nextSequence: number;
	isActive: boolean;
	organizationId: string;
}

export interface InvoiceItem {
	id: string;
	invoiceId: string;
	productId?: string | null;
	serviceId?: string | null;
	description: string;
	quantity: number;
	unitPrice: number;
	baseTaxRate?: number;
	taxRate: number;
	discount: number;
	subtotal: number;
	taxAmount: number;
	total: number;
	taxBreakdown?: Array<{
		id: string;
		name: string;
		kind: 'TAX' | 'RETENTION' | 'EXEMPTION';
		scope: 'GLOBAL' | 'CUSTOMER' | 'CUSTOMER_CATEGORY' | 'SERVICE' | 'SERVICE_CATEGORY';
		targetValue?: string | null;
		rate: number;
		effect: 'ADDITIVE' | 'EXEMPTION';
	}> | null;
}

export interface Invoice {
	id: string;
	number?: string | null;
	status: InvoiceStatus;
	date: string;
	customerId?: string | null;
	customer?: Customer | null;
	customerName: string;
	customerNif?: string | null;
	customerAddress?: string | null;
	subtotal: number;
	discountTotal: number;
	taxTotal: number;
	total: number;
	currency: string;
	paymentStatus: 'PENDENTE' | 'PAGO' | 'PARCIAL' | 'VENCIDO';
	amountPaid: number;
	notes?: string | null;
	cancelReason?: string | null;
	seriesId: string;
	series?: InvoiceSeries | null;
	userId: string;
	items: InvoiceItem[];
	createdAt: string;
	updatedAt: string;
}

export type TaxRuleKind = 'TAX' | 'RETENTION' | 'EXEMPTION';
export type TaxRuleScope = 'GLOBAL' | 'CUSTOMER' | 'CUSTOMER_CATEGORY' | 'SERVICE' | 'SERVICE_CATEGORY';

export interface TaxRule {
	id: string;
	name: string;
	kind: TaxRuleKind;
	scope: TaxRuleScope;
	targetValue?: string | null;
	rate: number;
	priority: number;
	isActive: boolean;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface BillingPaginatedResponse<T> {
	data: T[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface Proforma {
	id: string;
	number?: string | null;
	status: 'DRAFT' | 'SENT' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';
	date: string;
	customerId?: string | null;
	customerName: string;
	customerNif?: string | null;
	customerAddress?: string | null;
	subtotal: number;
	discountTotal: number;
	taxTotal: number;
	total: number;
	currency: string;
	expiryDate?: string | null;
	items: any[];
}

export interface CreditNote {
	id: string;
	number?: string | null;
	status: 'DRAFT' | 'ISSUED' | 'CANCELLED';
	date: string;
	invoiceId: string;
	invoice?: Invoice | null;
	creditType: 'TOTAL' | 'PARTIAL';
	amount: number;
	reason: string;
	items: any[];
}

export interface Receipt {
	id: string;
	number?: string | null;
	status: 'DRAFT' | 'ISSUED' | 'CANCELLED';
	date: string;
	invoiceId: string;
	invoice?: Invoice | null;
	amount: number;
	paymentMethod?: string | null;
	reference?: string | null;
}
