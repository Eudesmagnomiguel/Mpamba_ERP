'use client';

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface DistributionChartProps {
    data: Array<{ name: string; value: number }>;
    isLoading?: boolean;
}

const COLORS = ['#4738A8', '#6366F1', '#818CF8', '#C7D2FE', '#A5B4FC', '#E0E7FF'];

export default function DistributionChart({ data, isLoading = false }: DistributionChartProps) {
    const topPlan = [...(data || [])].sort((a, b) => b.value - a.value)[0];

    if (isLoading) {
        return (
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-full min-h-[420px] flex items-center justify-center">
                <Loader2 size={28} className="text-slate-300 animate-spin" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-full min-h-[420px] flex items-center justify-center">
                <p className="text-sm font-medium text-slate-400 text-center px-4">Sem dados de distribuição de planos ainda.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-full flex flex-col">
            <div>
                <h3 className="text-lg font-bold text-slate-900">Distribuição de Planos</h3>
                <p className="text-slate-500 text-xs font-medium mt-1">Divisão por categoria de subscrição.</p>
            </div>

            <div className="flex-1 w-full mt-4 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            iconType="circle"
                            formatter={(value) => (
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-50">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-sm border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano Mais Popular</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">{topPlan?.name || '—'}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-sm border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Planos</p>
                        <p className="text-sm font-bold text-primary mt-1">{data.length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

