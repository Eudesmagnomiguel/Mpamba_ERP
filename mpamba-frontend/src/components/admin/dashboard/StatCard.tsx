'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    className?: string;
    color?: 'primary' | 'success' | 'warning' | 'info' | 'danger';
    isLoading?: boolean;
}

export default function StatCard({
    title,
    value,
    icon: Icon,
    className,
    color = 'primary',
    isLoading = false
}: StatCardProps) {
    return (
        <div 
            className={cn(
                "bg-white p-6 transition-colors hover:bg-slate-50/50",
                className
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0",
                    color === 'primary' && "bg-primary/10 text-primary",
                    color === 'success' && "bg-emerald-500/10 text-emerald-600",
                    color === 'warning' && "bg-amber-500/10 text-amber-600",
                    color === 'info' && "bg-blue-500/10 text-blue-600",
                    color === 'danger' && "bg-rose-500/10 text-rose-600",
                )}>
                    <Icon size={20} />
                </div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider leading-tight">{title}</p>
            </div>
            
            <div className="mt-4">
                {isLoading ? (
                    <div className="h-6 w-20 bg-slate-100 rounded animate-pulse" />
                ) : (
                    <h3 className="text-2xl font-bold text-slate-900 leading-none">{value}</h3>
                )}
            </div>
        </div>
    );
}




