'use client';

import React, { use } from 'react';
import { UserCog, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import UserForm from '@/components/admin/users/UserForm';
import { useUser, useUpdateUser } from '@/hooks/core/useUser';
import { UpdateUserDto } from '@/shared/dto/user.dto';

interface EditUserPageProps {
    params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { data: userData, isLoading: isLoadingUser, isError } = useUser(id);
    const updateUserMutation = useUpdateUser();

    const handleSubmit = async (data: any) => {
        try {
            // Se a senha estiver vazia, removemos do payload para não atualizar
            const payload: UpdateUserDto = { ...data };
            if (!payload.password) delete payload.password;
            
            // Tratamento de organização nula/sistema
            if (payload.organizationId === 'none') {
                payload.organizationId = undefined; // No backend costuma ser null para super admin
            }

            await updateUserMutation.mutateAsync({ id, data: payload });
            toast.success('Usuário atualizado com sucesso!');
            router.push('/admin/users');
        } catch (error: any) {
            console.error('Error updating user:', error);
            const message = error.response?.data?.message || 'Ocorreu um erro ao atualizar o usuário.';
            toast.error(message);
        }
    };

    if (isLoadingUser) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={40} className="text-primary animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando dados do usuário...</p>
            </div>
        );
    }

    if (isError || !userData) {
        return (
            <div className="max-w-4xl space-y-6">
                <div className="bg-red-50 border border-red-100 rounded-sm p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <AlertCircle size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-lg font-bold text-red-900">Erro ao carregar usuário</h2>
                    <p className="text-sm text-red-700 font-medium max-w-md mx-auto">
                        Não foi possível encontrar o usuário solicitado ou ocorreu uma falha na comunicação com o servidor.
                    </p>
                    <button 
                        onClick={() => router.push('/admin/users')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-sm text-sm font-bold hover:bg-red-700 transition-all"
                    >
                        <ArrowLeft size={16} />
                        Voltar para lista
                    </button>
                </div>
            </div>
        );
    }

    const user = userData;

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
                        <UserCog size={24} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Editar Usuário</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            Atualizando informações de: <span className="text-primary font-bold">{user.name}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Configurações da Conta</h3>
                </div>
                <div className="p-8">
                    <UserForm 
                        isEdit
                        initialData={{
                            name: user.name,
                            email: user.email,
                            isActive: user.isActive,
                            organizationId: user.organizationId || 'none',
                            roleIds: user.roles?.map((r: any) => r.roleId) || []
                        }}
                        onSubmit={handleSubmit} 
                        isLoading={updateUserMutation.isPending} 
                    />
                </div>
            </div>
        </div>
    );
}
