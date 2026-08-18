'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface ModuleAdoptionChartProps {
    data: Array<{ code: string; name: string; organizations: number }>;
    isLoading?: boolean;
}

const COLORS: Record<string, string> = {
    faturacao: '#6366F1',
    stock: '#10B981',
    tesouraria: '#F59E0B',
    contabilidade: '#C4643A',
};

export default function ModuleAdoptionChart({ data, isLoading = false }: ModuleAdoptionChartProps) {
    if (isLoading) {
        return (
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-full min-h-[320px] flex items-center justify-center">
                <Loader2 size={28} className="text-slate-300 animate-spin" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-full min-h-[320px] flex items-center justify-center">
                <p className="text-sm font-medium text-slate-400 text-center px-4">Sem dados de adoção de módulos ainda.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-full flex flex-col">
            <div>
                <h3 className="text-lg font-bold text-slate-900">Adoção de Módulos</h3>
                <p className="text-slate-500 text-xs font-medium mt-1">Organizações com cada módulo ativo.</p>
            </div>

            <div className="flex-1 w-full mt-4 min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }} />
                        <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} />
                        <Tooltip
                            cursor={{ fill: '#F8FAFC' }}
                            contentStyle={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                padding: '8px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                            }}
                            itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                            formatter={(value: any) => [`${value} organizações`, '']}
                        />
                        <Bar dataKey="organizations" radius={[0, 4, 4, 0]} maxBarSize={22}>
                            {data.map((entry) => (
                                <Cell key={entry.code} fill={COLORS[entry.code] || '#94A3B8'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
