import type { PaginationMeta } from '@/shared/types/pagination.types';

export type AccountType = 'CAIXA' | 'BANCO';
export type FinancialMovementType = 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';
export type PaymentStatus = 'PENDENTE' | 'PAGO' | 'PARCIAL' | 'VENCIDO';

export interface CostCenter {
	id: string;
	name: string;
	code?: string | null;
	description?: string | null;
	isActive: boolean;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface Payable {
	id: string;
	description: string;
	amount: number;
	dueDate: string;
	status: PaymentStatus;
	supplierId?: string | null;
	supplier?: { id: string; name: string } | null;
	categoryId?: string | null;
	category?: FinancialCategory | null;
	costCenterId?: string | null;
	costCenter?: CostCenter | null;
	notes?: string | null;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface Receivable {
	id: string;
	description: string;
	amount: number;
	dueDate: string;
	status: PaymentStatus;
	customerId?: string | null;
	customer?: { id: string; name: string } | null;
	invoiceId?: string | null;
	categoryId?: string | null;
	category?: FinancialCategory | null;
	costCenterId?: string | null;
	costCenter?: CostCenter | null;
	notes?: string | null;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface FinancialAccount {
	id: string;
	name: string;
	type: AccountType;
	currency: string;
	currentBalance: number;
	allowNegative: boolean;
	isActive: boolean;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface FinancialCategory {
	id: string;
	name: string;
	type: FinancialMovementType;
	isActive: boolean;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface FinancialMovementAccountSummary {
	id: string;
	name: string;
	type: AccountType;
}

export interface FinancialMovementCategorySummary {
	id: string;
	name: string;
}

export interface FinancialMovementUserSummary {
	id: string;
	name: string;
}

export interface FinancialMovement {
	id: string;
	accountId: string;
	account?: FinancialMovementAccountSummary;
	type: FinancialMovementType;
	amount: number;
	date: string;
	description: string;
	reference?: string | null;
	categoryId?: string | null;
	category?: FinancialMovementCategorySummary | null;
	transferId?: string | null;
	userId: string;
	user?: FinancialMovementUserSummary;
	organizationId: string;
	createdAt: string;
	isReconciled?: boolean;
	bankStatementLineId?: string | null;
}

export type BankStatementStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED';

export interface BankStatementLine {
	id: string;
	statementId: string;
	date: string;
	description: string;
	amount: number;
	type: FinancialMovementType;
	reference?: string | null;
	isReconciled: boolean;
	movement?: FinancialMovement | null;
}

export interface BankStatement {
	id: string;
	accountId: string;
	account?: FinancialMovementAccountSummary;
	organizationId: string;
	fileName: string;
	startDate: string;
	endDate: string;
	startingBalance: number;
	endingBalance: number;
	status: BankStatementStatus;
	createdAt: string;
	updatedAt: string;
	lines: BankStatementLine[];
}

export interface TreasurySummary {
	totalBalance: number;
	totalIncomes: number;
	totalExpenses: number;
	evolutionData: Array<{ date: string; incomes: number; expenses: number; balance: number }>;
	categoryData: Array<{ name: string; value: number; color: string; type: FinancialMovementType }>;
	accountsBalance: Array<{ id: string; name: string; type: AccountType; balance: number }>;
}

export interface TreasuryPaginatedResponse<T> {
	data: T[];
	pagination: PaginationMeta;
}
