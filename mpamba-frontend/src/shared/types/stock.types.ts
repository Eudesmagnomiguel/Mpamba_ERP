import type { PaginationMeta } from '@/shared/types/pagination.types';

export type StockMovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE';

export interface Category {
	id: string;
	name: string;
	description?: string | null;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface Supplier {
	id: string;
	name: string;
	nif?: string | null;
	email?: string | null;
	phone?: string | null;
	address?: string | null;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface Product {
	id: string;
	name: string;
	sku: string;
	unit: string;
	description?: string | null;
	price?: number | null;
	isActive: boolean;
	currentQuantity: number;
	minStock?: number | null;
	maxStock?: number | null;
	categoryId?: string | null;
	category?: Category | null;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface StockMovementProductSummary {
	id: string;
	name: string;
	sku: string;
	unit: string;
}

export interface StockMovementUserSummary {
	id: string;
	name: string;
}

export interface StockMovement {
	id: string;
	productId: string;
	product?: StockMovementProductSummary;
	type: StockMovementType;
	quantity: number;
	reference?: string | null;
	reason?: string | null;
	supplierId?: string | null;
	supplier?: Supplier | null;
	userId: string;
	user?: StockMovementUserSummary;
	organizationId: string;
	createdAt: string;
}

export interface StockSummary {
	totalProducts: number;
	lowStockItems: number;
	totalQuantity: number;
	totalInventoryValue: number;
	evolutionData: Array<{ name: string; value: number }>;
	categoryData: Array<{ name: string; value: number; color: string }>;
}

export interface StockMostUsedProduct {
	id?: string;
	name?: string;
	sku?: string;
	unit?: string;
	totalExits: number;
}

export interface StockPaginatedResponse<T> {
	data: T[];
	pagination: PaginationMeta;
}

export interface StockProductMovementResult {
	movement: StockMovement;
	product: Product;
	previousQuantity: number;
	newQuantity: number;
}

export interface StockAdjustmentResult extends StockProductMovementResult {
	adjustment: number;
}

export interface StockReversalResult {
	originalMovement: string;
	reversalMovement: StockMovement;
	product: Product;
	previousQuantity: number;
	newQuantity: number;
}