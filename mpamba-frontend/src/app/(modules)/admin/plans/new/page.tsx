'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PlanForm from '@/components/admin/plans/PlanForm';
import { PlanDTO } from '@/shared/dto/plan.dto';

export default function NewPlanPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: PlanDTO) => {
        setIsLoading(true);
        console.log('Submitting new plan:', data);
        
        // Simulating API call
        setTimeout(() => {
            setIsLoading(false);
            router.push('/admin/plans');
        }, 1500);
    };

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
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Criar Novo Plano</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Defina os detalhes e benefícios para o seu novo pacote de serviços.</p>
                </div>
            </div>

            {/* Form */}
            <PlanForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
    );
}
