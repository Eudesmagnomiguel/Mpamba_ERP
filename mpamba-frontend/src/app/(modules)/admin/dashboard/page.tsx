'use client';

import Link from 'next/link';
import {
    Users,
    Building2,
    CreditCard,
    TrendingUp,
    Plus,
} from 'lucide-react';
import StatCard from '@/components/admin/dashboard/StatCard';
import GrowthChart from '@/components/admin/dashboard/GrowthChart';
import DistributionChart from '@/components/admin/dashboard/DistributionChart';
import ModuleAdoptionChart from '@/components/admin/dashboard/ModuleAdoptionChart';
import SubscriptionStatusChart from '@/components/admin/dashboard/SubscriptionStatusChart';
import { useDashboardStats } from '@/hooks/core/useDashboard';

export default function Dashboard() {
    const { data: stats, isLoading } = useDashboardStats();

    const growthData = (stats?.monthlyGrowth || []).map(m => ({
        name: m.name,
        orgs: m.newOrganizations,
        users: m.newUsers,
    }));

    const distributionData = (stats?.planDistribution || []).map(p => ({
        name: p.planName,
        value: p.count,
    }));

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Backoffice Mpamba</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Análise em tempo real do ecossistema Mpamba.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/organizations/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-sm font-semibold text-sm hover:bg-primary-hover transition-all shadow-sm shadow-primary/20"
                    >
                        <Plus size={16} />
                        Nova Organização
                    </Link>
                </div>
            </div>

           <div className='grid grid-cols-1 xl:grid-cols-3 gap-5' >
				<div className="xl:col-span-2 space-y-4">
					 {/* Stats Grid - Connected Design */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
						<StatCard
							title="Total Orgs"
							value={stats?.totals.organizations ?? 0}
							icon={Building2}
							color="primary"
							isLoading={isLoading}
							className="border-b border-slate-100 sm:border-b lg:border-b-0 lg:border-r"
						/>
						<StatCard
							title="Utilizadores Ativos"
							value={stats?.totals.activeUsers ?? 0}
							icon={Users}
							color="info"
							isLoading={isLoading}
							className="border-b border-slate-100 sm:border-b lg:border-b-0 lg:border-r"
						/>
						<StatCard
							title="Receita (MRR)"
							value={`${(stats?.totals.mrr ?? 0).toLocaleString()} Kz`}
							icon={CreditCard}
							color="success"
							isLoading={isLoading}
							className="border-b border-slate-100 sm:border-b-0 lg:border-r"
						/>
						<StatCard
							title="Conversão"
							value={`${stats?.totals.conversionRate ?? 0}%`}
							icon={TrendingUp}
							color="warning"
							isLoading={isLoading}
							className="border-none"
						/>
					</div>
					<GrowthChart data={growthData} isLoading={isLoading} />
				</div>
				<div className="xl:col-span-1">
					<DistributionChart data={distributionData} isLoading={isLoading} />
				</div>
		   </div>

		   <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
				<ModuleAdoptionChart data={stats?.moduleAdoption || []} isLoading={isLoading} />
				<SubscriptionStatusChart data={stats?.subscriptionStatusBreakdown || []} isLoading={isLoading} />
		   </div>
        </div>
    );
}
