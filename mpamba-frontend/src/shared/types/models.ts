export interface User {
	id: string;
	name: string;
	urlImageProfile?: string | null;
	email: string;
	username?: string | null;
	isActive: boolean;
	hasCustomModuleAccess?: boolean;
	moduleAccess?: string[];
	organizationId?: string | null;
	organization?: Organization | null;
	roles?: UserRole[];
	onboardingCompletedAt?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Organization {
	id: string;
	name: string;
	urlImageLogo?: string | null;
	nif?: string | null;
	address?: string | null;
	phone?: string | null;
	email?: string | null;
	isActive: boolean;
	users?: User[];
	roles?: Role[];
	modules?: OrganizationModule[];
	planId?: string | null;
	plan?: Plan | null;
	subscription?: Subscription | null;
	invoiceFooterNote?: string | null;
	invoiceDueDays?: number;
	posInvoiceThreshold?: number;
	// Dados de emitente impressos na factura (formato AGT)
	city?: string | null;
	postalCode?: string | null;
	country?: string | null;
	fax?: string | null;
	logoUrl?: string | null;
	bankName?: string | null;
	bankAccount?: string | null;
	iban?: string | null;
	agtValidationNumber?: string | null;
	taxExemptionCode?: string | null;
	taxExemptionReason?: string | null;
	retentionEntity?: string | null;
	retentionRate?: number | null;
	_count?: { users: number };
	createdAt: string;
}

export interface Role {
	id: string;
	name: string;
	description?: string | null;
	organizationId: string;
	organization?: Organization;
	moduleId?: string | null;
	module?: Module | null;
	permissions?: RolePermission[];
	users?: UserRole[];
}

export interface Permission {
	id: string;
	code: string;
	description?: string | null;
	roles?: RolePermission[];
}

export interface UserRole {
	userId: string;
	roleId: string;
	user?: User;
	role?: Role;
}

export interface RolePermission {
	roleId: string;
	permissionId: string;
	role?: Role;
	permission?: Permission;
}

export interface Plan {
	id: string;
	code: string;
	name: string;
	description?: string | null;
	price: number;
	interval: string;
	modules?: PlanModule[];
	organizations?: Organization[];
	createdAt: string;
	updatedAt: string;
}

export interface PlanModule {
	planId: string;
	moduleId: string;
	plan?: Plan;
	module?: Module;
}

export interface Module {
	id: string;
	code: string;
	name: string;
	description?: string | null;
	organizations?: OrganizationModule[];
	planModules?: PlanModule[];
}

export interface OrganizationModule {
	organizationId: string;
	moduleId: string;
	isActive: boolean;
	organization?: Organization;
	module?: Module;
}

export interface Subscription {
	id: string;
	organizationId: string;
	organization?: Organization;
	planId: string;
	plan?: Plan;
	status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'PAST_DUE' | 'TRIAL' | 'EXPIRED';
	startDate: string;
	endDate?: string | null;
	autoRenew: boolean;
	createdAt: string;
	updatedAt: string;
}
