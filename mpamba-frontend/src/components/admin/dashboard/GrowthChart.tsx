'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface GrowthChartProps {
    data: Array<{ name: string; orgs: number; users: number }>;
    isLoading?: boolean;
}

export default function GrowthChart({ data, isLoading = false }: GrowthChartProps) {
    if (isLoading) {
        return (
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-[420px] flex items-center justify-center">
                <Loader2 size={28} className="text-slate-300 animate-spin" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-[420px] flex items-center justify-center">
                <p className="text-sm font-medium text-slate-400">Sem dados de crescimento ainda.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Análise de Crescimento</h3>
                    <p className="text-slate-500 text-xs font-medium">Novas organizações e usuários ativos mensalmente.</p>
                </div>
                <div className="flex gap-4 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 px-2 py-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Usuários</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Organizações</span>
                    </div>
                </div>
            </div>

            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4738A8" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#4738A8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} 
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#FFFFFF', 
                                borderRadius: '12px', 
                                border: '1px solid #E2E8F0', 
                                padding: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                            }}
                            itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                            labelStyle={{ fontWeight: 'bold', fontSize: '12px', color: '#1E293B', marginBottom: '4px' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="users" 
                            stroke="#4738A8" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorUsers)" 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="orgs" 
                            stroke="#CBD5E1" 
                            strokeWidth={2}
                            fill="transparent" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}


