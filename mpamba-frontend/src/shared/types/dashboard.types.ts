export interface DashboardStats {
	totals: {
		organizations: number;
		activeUsers: number;
		mrr: number;
		conversionRate: number;
	};
	monthlyGrowth: Array<{ name: string; newOrganizations: number; newUsers: number }>;
	planDistribution: Array<{ planId: string; planName: string; price: number; count: number }>;
	moduleAdoption: Array<{ code: string; name: string; organizations: number }>;
	subscriptionStatusBreakdown: Array<{ status: string; count: number }>;
}
