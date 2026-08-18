'use client';

import React from 'react';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import UserForm from '@/components/admin/users/UserForm';
import { useCreateUser } from '@/hooks/core/useUser';
import { CreateUserDto } from '@/shared/dto/user.dto';

export default function NewUserPage() {
    const router = useRouter();
    const createUserMutation = useCreateUser();

    const handleSubmit = async (data: CreateUserDto) => {
        try {
            // Se organizationId for "none", removemos ou enviamos null se o backend aceitar
            const payload = {
                ...data,
                organizationId: data.organizationId === 'none' ? undefined : data.organizationId
            };

            await createUserMutation.mutateAsync(payload);
            toast.success('Usuário criado com sucesso!');
            router.push('/admin/users');
        } catch (error: any) {
            console.error('Error creating user:', error);
            const message = error.response?.data?.message || 'Ocorreu um erro ao criar o usuário.';
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
                        <UserPlus size={24} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Novo Usuário</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Preencha os dados abaixo para cadastrar um novo integrante no ecossistema.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Informações Cadastrais</h3>
                </div>
                <div className="p-8">
                    <UserForm 
                        onSubmit={handleSubmit} 
                        isLoading={createUserMutation.isPending} 
                    />
                </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-100 rounded-sm p-4 flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-sm text-blue-600 mt-0.5">
                    <UserPlus size={14} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-blue-900">Segurança de Acesso</h4>
                    <p className="text-xs text-blue-700/80 font-medium leading-relaxed">
                        Um convite será enviado para o email do usuário com as instruções de acesso. Certifique-se de atribuir o papel (role) correto para definir suas permissões.
                    </p>
                </div>
            </div>
        </div>
    );
}
