'use client';

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface SubscriptionStatusChartProps {
    data: Array<{ status: string; count: number }>;
    isLoading?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Ativas',
    TRIAL: 'Em Teste',
    PAST_DUE: 'Em Atraso',
    SUSPENDED: 'Suspensas',
    CANCELLED: 'Canceladas',
    EXPIRED: 'Expiradas',
};

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: '#10B981',
    TRIAL: '#6366F1',
    PAST_DUE: '#F59E0B',
    SUSPENDED: '#F97316',
    CANCELLED: '#94A3B8',
    EXPIRED: '#EB5757',
};

export default function SubscriptionStatusChart({ data, isLoading = false }: SubscriptionStatusChartProps) {
    if (isLoading) {
        return (
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-full min-h-[320px] flex items-center justify-center">
                <Loader2 size={28} className="text-slate-300 animate-spin" />
            </div>
        );
    }

    const total = (data || []).reduce((sum, d) => sum + d.count, 0);

    if (!data || data.length === 0 || total === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-full min-h-[320px] flex items-center justify-center">
                <p className="text-sm font-medium text-slate-400 text-center px-4">Sem subscrições registadas ainda.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-full flex flex-col">
            <div>
                <h3 className="text-lg font-bold text-slate-900">Estado das Subscrições</h3>
                <p className="text-slate-500 text-xs font-medium mt-1">{total} subscrições no total.</p>
            </div>

            <div className="flex-1 w-full mt-4 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="count" stroke="none">
                            {data.map((entry) => (
                                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94A3B8'} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                padding: '8px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                            }}
                            itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                            formatter={(value: any, _name: any, entry: any) => [`${value}`, STATUS_LABELS[entry.payload.status] || entry.payload.status]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2">
                {data.map((d) => (
                    <div key={d.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.status] || '#94A3B8' }} />
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{STATUS_LABELS[d.status] || d.status}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900">{d.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
