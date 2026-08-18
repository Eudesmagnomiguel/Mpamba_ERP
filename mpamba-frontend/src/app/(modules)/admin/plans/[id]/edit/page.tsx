'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PlanForm from '@/components/admin/plans/PlanForm';
import { PlanDTO } from '@/shared/dto/plan.dto';
import { usePlan, useUpdatePlan } from '@/hooks/core/usePlan';

const CYCLE_TO_INTERVAL: Record<string, string> = {
    'Mensal': 'month',
    'Anual': 'year',
    '14 Dias': 'trial',
};

const INTERVAL_TO_CYCLE: Record<string, string> = {
    month: 'Mensal',
    year: 'Anual',
    trial: '14 Dias',
};

function formatPrice(price: number) {
    return `Kz ${price.toLocaleString('en-US')}`;
}

function parsePrice(price: string) {
    const numeric = Number(price.replace(/[^\d.]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
}

export default function EditPlanPage() {
    const router = useRouter();
    const params = useParams();
    const planId = params.id as string;

    const { data: plan, isLoading, isError } = usePlan(planId);
    const updatePlanMutation = useUpdatePlan();

    const [moduleIds, setModuleIds] = useState<string[]>([]);
    const [initialData, setInitialData] = useState<Partial<PlanDTO> | null>(null);

    useEffect(() => {
        if (!plan) return;

        const planModules = (plan.modules as any[]) || [];
        setModuleIds(planModules.map((m) => m.id));

        setInitialData({
            name: plan.name,
            price: formatPrice(plan.price),
            cycle: INTERVAL_TO_CYCLE[plan.interval] || 'Mensal',
            features: [''],
            status: 'Ativo',
            color: 'bg-primary',
            code: plan.code,
            description: plan.description || '',
        });
    }, [plan]);

    const handleSubmit = async (data: PlanDTO) => {
        try {
            await updatePlanMutation.mutateAsync({
                id: planId,
                data: {
                    name: data.name,
                    description: data.description,
                    price: parsePrice(data.price) as any,
                    interval: CYCLE_TO_INTERVAL[data.cycle] || 'month',
                    moduleIds,
                } as any,
            });
            toast.success('Plano atualizado com sucesso!');
            router.push('/admin/plans');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Não foi possível atualizar o plano.';
            toast.error(message);
        }
    };

    if (isLoading || !initialData) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
                <Loader2 size={32} className="text-primary animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando plano...</p>
            </div>
        );
    }

    if (isError || !plan) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <p className="text-sm font-bold text-red-500">Plano não encontrado.</p>
                <button
                    onClick={() => router.push('/admin/plans')}
                    className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
                >
                    Voltar para Planos
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary transition-all font-bold text-xs uppercase tracking-widest"
                >
                    <ArrowLeft size={16} />
                    Voltar para Planos
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Editar Plano</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Atualize os detalhes do plano <span className="text-primary font-bold">{initialData.name}</span>.</p>
                </div>
            </div>

            {/* Form */}
            <PlanForm initialData={initialData} onSubmit={handleSubmit} isLoading={updatePlanMutation.isPending} />
        </div>
    );
}
