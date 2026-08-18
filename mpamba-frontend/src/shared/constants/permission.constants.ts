export const PERMISSIONS = {
	// User Management
	USER_VIEW: 'user:view',
	USER_CREATE: 'user:create',
	USER_UPDATE: 'user:update',
	USER_DELETE: 'user:delete',

	// Role Management
	ROLE_VIEW: 'role:view',
	ROLE_CREATE: 'role:create',
	ROLE_UPDATE: 'role:update',
	ROLE_DELETE: 'role:delete',

	// Organization Management
	ORGANIZATION_VIEW: 'org:view',
	ORGANIZATION_CREATE: 'org:create',
	ORGANIZATION_UPDATE: 'org:update',
	ORGANIZATION_DELETE: 'org:delete',

	// Plan Management
	PLAN_VIEW: 'plan:view',
	PLAN_CREATE: 'plan:create',
	PLAN_UPDATE: 'plan:update',
	PLAN_DELETE: 'plan:delete',

	// plan module
	PLAN_MODULE_VIEW: 'plan_module:view',
	PLAN_MODULE_CREATE: 'plan_module:create',
	PLAN_MODULE_UPDATE: 'plan_module:update',
	PLAN_MODULE_DELETE: 'plan_module:delete',

	// organization module
	ORGANIZATION_MODULE_VIEW: 'organization_module:view',
	ORGANIZATION_MODULE_CREATE: 'organization_module:create',
	ORGANIZATION_MODULE_UPDATE: 'organization_module:update',
	ORGANIZATION_MODULE_DELETE: 'organization_module:delete',

	// Role Permission Management
	ROLE_PERMISSION_VIEW: 'role_permission:view',
	ROLE_PERMISSION_CREATE: 'role_permission:create',
	ROLE_PERMISSION_UPDATE: 'role_permission:update',
	ROLE_PERMISSION_DELETE: 'role_permission:delete',

	// User Role Management
	USER_ROLE_VIEW: 'user_role:view',
	USER_ROLE_CREATE: 'user_role:create',
	USER_ROLE_UPDATE: 'user_role:update',
	USER_ROLE_DELETE: 'user_role:delete',

	// Permission Management
	PERMISSION_VIEW: 'permission:view',
	PERMISSION_CREATE: 'permission:create',
	PERMISSION_UPDATE: 'permission:update',
	PERMISSION_DELETE: 'permission:delete',

	// Module Management
	MODULE_VIEW: 'module:view',
	MODULE_CREATE: 'module:create',
	MODULE_UPDATE: 'module:update',
	MODULE_DELETE: 'module:delete',

	// Stock Management
	STOCK_PRODUCT_VIEW: 'stock:product:view',
	STOCK_PRODUCT_CREATE: 'stock:product:create',
	STOCK_PRODUCT_UPDATE: 'stock:product:update',
	STOCK_PRODUCT_DELETE: 'stock:product:delete',
	STOCK_MOVEMENT_VIEW: 'stock:movement:view',
	STOCK_MOVEMENT_CREATE: 'stock:movement:create',
	STOCK_ADJUSTMENT_CREATE: 'stock:adjustment:create',
	STOCK_REPORT_VIEW: 'stock:report:view',
	STOCK_CATEGORY_VIEW: 'stock:category:view',
	STOCK_CATEGORY_CREATE: 'stock:category:create',
	STOCK_CATEGORY_UPDATE: 'stock:category:update',
	STOCK_CATEGORY_DELETE: 'stock:category:delete',
	STOCK_SUPPLIER_VIEW: 'stock:supplier:view',
	STOCK_SUPPLIER_CREATE: 'stock:supplier:create',
	STOCK_SUPPLIER_UPDATE: 'stock:supplier:update',
	STOCK_SUPPLIER_DELETE: 'stock:supplier:delete',
	STOCK_ENTRY_VIEW: 'stock:entry:view',
	STOCK_ENTRY_CREATE: 'stock:entry:create',
	STOCK_EXIT_VIEW: 'stock:exit:view',
	STOCK_EXIT_CREATE: 'stock:exit:create',

	// Billing Management
	INVOICE_VIEW: 'invoice:view',
	INVOICE_CREATE: 'invoice:create',
	INVOICE_UPDATE: 'invoice:update',
	INVOICE_ISSUE: 'invoice:issue',
	INVOICE_CANCEL: 'invoice:cancel',
	INVOICE_SEND: 'invoice:send',

	// Additional Billing Features
	BILLING_RECEIPT_CREATE: 'billing:receipt:create',
	BILLING_RECEIPT_VIEW: 'billing:receipt:view',
	BILLING_PROFORMA_CREATE: 'billing:proforma:create',
	BILLING_PROFORMA_VIEW: 'billing:proforma:view',
	BILLING_QUOTE_CREATE: 'billing:quote:create',
	BILLING_QUOTE_VIEW: 'billing:quote:view',
	BILLING_TAX_MANAGE: 'billing:tax:manage',
	BILLING_SERIES_MANAGE: 'billing:series:manage',
	BILLING_REPORT_VIEW: 'billing:report:view',
	BILLING_POS_MANAGE: 'billing:pos:manage',
	BILLING_DISCOUNT_APPROVE: 'billing:discount:approve',

	// Customer Management
	CUSTOMER_VIEW: 'customer:view',
	CUSTOMER_CREATE: 'customer:create',
	CUSTOMER_UPDATE: 'customer:update',
	CUSTOMER_DELETE: 'customer:delete',

	// Treasury Management
	TREASURY_ACCOUNT_CREATE: 'treasury:account:create',
	TREASURY_ACCOUNT_VIEW: 'treasury:account:view',
	TREASURY_CATEGORY_CREATE: 'treasury:category:create',
	TREASURY_CATEGORY_VIEW: 'treasury:category:view',
	TREASURY_CATEGORY_UPDATE: 'treasury:category:update',
	TREASURY_CATEGORY_DELETE: 'treasury:category:delete',
	TREASURY_TRANSACTION_CREATE: 'treasury:transaction:create',
	TREASURY_TRANSACTION_VIEW: 'treasury:transaction:view',
	TREASURY_TRANSACTION_UPDATE: 'treasury:transaction:update',
	TREASURY_TRANSACTION_DELETE: 'treasury:transaction:delete',
	TREASURY_TRANSFER_CREATE: 'treasury:transfer:create',
	TREASURY_REPORT_VIEW: 'treasury:report:view',

	// Dashboard
	SETTING_VIEW: 'setting:view',
	SETTING_UPDATE: 'setting:update',
	DASHBOARD_VIEW: 'dashboard:view',

	// Contabilidade
	ACCOUNTING_ACCOUNT_VIEW: 'accounting:account:view',
	ACCOUNTING_ACCOUNT_CREATE: 'accounting:account:create',
	ACCOUNTING_ACCOUNT_UPDATE: 'accounting:account:update',
	ACCOUNTING_ENTRY_VIEW: 'accounting:entry:view',
	ACCOUNTING_ENTRY_CREATE: 'accounting:entry:create',
	ACCOUNTING_REPORT_VIEW: 'accounting:report:view',

	// Notifications
	NOTIFICATION_SEND: 'notification:send',

} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];