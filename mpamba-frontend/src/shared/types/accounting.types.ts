import type { PaginationMeta } from '@/shared/types/pagination.types';

export type JournalEntrySource = 'MANUAL' | 'AUTOMATIC';
export type AccountSide = 'ATIVO' | 'PASSIVO' | 'CAPITAL_PROPRIO' | 'CUSTO' | 'PROVEITO';

export interface AccountingAccount {
	id: string;
	code: string;
	name: string;
	class: number;
	side: AccountSide;
	isActive: boolean;
	organizationId: string;
	parentId?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface JournalEntryLine {
	id: string;
	entryId: string;
	accountId: string;
	debit: number;
	credit: number;
	description?: string | null;
	account?: AccountingAccount;
}

export interface JournalEntry {
	id: string;
	number: string | null;
	date: string;
	description: string;
	source: JournalEntrySource;
	sourceReference?: string | null;
	reversedById?: string | null;
	organizationId: string;
	userId: string;
	createdAt: string;
	lines: JournalEntryLine[];
	user?: { id: string; name: string };
}

export interface TrialBalanceRow {
	accountId: string;
	code: string;
	name: string;
	class: number;
	debit: number;
	credit: number;
	balance: number;
}

export interface TrialBalance {
	rows: TrialBalanceRow[];
	totals: { debit: number; credit: number; balanced: boolean };
}

export interface LedgerRow {
	entryId: string;
	number: string | null;
	date: string;
	description: string;
	sourceReference?: string | null;
	debit: number;
	credit: number;
	balance: number;
}

export interface AccountLedger {
	account: AccountingAccount;
	rows: LedgerRow[];
	closingBalance: number;
}

export interface AccountingPaginatedResponse<T> {
	data: T[];
	pagination: PaginationMeta;
}

export interface IncomeStatementRow {
	accountId: string;
	code: string;
	name: string;
	amount: number;
}

export interface IncomeStatement {
	costs: IncomeStatementRow[];
	revenues: IncomeStatementRow[];
	totals: { costs: number; revenues: number; netResult: number };
}

export interface BalanceSheetRow {
	accountId: string;
	code: string;
	name: string;
	balance: number;
}

export interface BalanceSheet {
	assets: BalanceSheetRow[];
	liabilities: BalanceSheetRow[];
	equity: BalanceSheetRow[];
	netResultOfPeriod: number;
	totals: { assets: number; liabilitiesAndEquity: number; balanced: boolean };
}
