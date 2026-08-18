'use client';

import React from 'react';
import { Building2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import OrganizationForm from '@/components/admin/organizations/OrganizationForm';
import { useCreateOrganization } from '@/hooks/module/organization';
import { CreateOrganizationDto } from '@/shared/dto/organization.dto';

export default function NewOrganizationPage() {
    const router = useRouter();
    const createOrgMutation = useCreateOrganization();

    const handleSubmit = async (data: CreateOrganizationDto) => {
        try {
            await createOrgMutation.mutateAsync(data);
            toast.success('Organização criada com sucesso!');
            router.push('/admin/organizations');
        } catch (error: any) {
            console.error('Error creating organization:', error);
            const message = error.response?.data?.message || 'Ocorreu um erro ao criar a organização.';
            toast.error(message);
        }
    };

    return (
        <div className="max-w-4xl space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest group w-fit"
                >
                    <div className="p-1.5 bg-white border border-slate-200 rounded-sm group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                        <ArrowLeft size={14} />
                    </div>
                    Voltar para lista
                </button>

                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/5 rounded-sm border border-primary/10">
                        <Building2 size={24} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nova Organização</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Cadastre uma nova entidade jurídica para gerir seus processos no Mpamba.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Perfil Institucional</h3>
                </div>
                <div className="p-8">
                    <OrganizationForm 
                        onSubmit={handleSubmit} 
                        isLoading={createOrgMutation.isPending} 
                    />
                </div>
            </div>
        </div>
    );
}
