'use client';

import { useState } from 'react';
import { 
    Users, 
    UserPlus, 
    Search, 
    Edit2, 
    Trash2, 
    Shield, 
    Mail, 
    Calendar,
    CheckCircle2,
    XCircle,
    Loader2,
    Filter,
    Download,
    MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/common/forms/Button';
import { useUsers, useDeleteUser } from '@/hooks/core/useUser';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import EmployeeModal from '@/components/core/users/EmployeeModal';
import type { User } from '@/shared/types/models';

export default function CoreUsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
    const { data: usersData, isLoading, isError } = useUsers();
    const deleteMutation = useDeleteUser();

    const currentUser = useAuthStore(state => state.user);
    const hasUserCreate = currentUser?.permissions?.includes(PERMISSIONS.USER_CREATE);
    const hasUserUpdate = currentUser?.permissions?.includes(PERMISSIONS.USER_UPDATE);
    const hasUserDelete = currentUser?.permissions?.includes(PERMISSIONS.USER_DELETE);

    const users = (usersData?.data || []).filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.roles?.some(ur => ur.role?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este utilizador?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Utilizador removido com sucesso');
        } catch (err) {
            toast.error('Erro ao remover utilizador');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Utilizadores & Equipa</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gerencie as contas e permissões de acesso da sua organização.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-sm text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={14} />
                        Exportar
                    </button>
                    {hasUserCreate && (
                        <Button
                            fullWidth={false}
                            onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}
                            className="flex items-center gap-2 px-4 h-9 bg-primary text-white rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            <UserPlus size={15} />
                            Cadastrar Funcionário
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Utilizadores', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Utilizadores Ativos', value: users.filter(u => u.isActive).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Acessos Pendentes', value: 0, icon: Mail, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Administradores', value: users.filter(u => u.roles?.some(r => r.role?.name.includes('ADMIN'))).length, icon: Shield, color: 'text-chart-2', bg: 'bg-chart-2/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-sm flex items-center justify-center", stat.bg, stat.color)}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-xl font-black text-slate-900 leading-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por nome, email ou função..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-sm text-slate-600 font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all flex-1 md:flex-none justify-center">
                        <Filter size={16} />
                        Filtros Avançados
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm flex flex-col min-h-[400px]">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilizador</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Função / Cargo</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Membro Desde</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 relative">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center border-none">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 size={40} className="text-primary animate-spin" />
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando equipa...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-rose-500 font-black uppercase tracking-widest text-xs">
                                        Erro ao carregar utilizadores. Verifique a sua ligação.
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <Users size={48} className="text-slate-200" />
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum utilizador encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/5 uppercase">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 leading-none uppercase tracking-tight">{user.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-1.5 text-slate-400">
                                                        <Mail size={12} />
                                                        <p className="text-[11px] font-medium italic">{user.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-primary" />
                                                <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">
                                                    {user.roles?.[0]?.role?.name || 'Sem Função'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest",
                                                user.isActive 
                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                            )}>
                                                {user.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                {user.isActive ? 'Ativo' : 'Inativo'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar size={14} className="text-slate-300" />
                                                <span className="text-[11px] font-bold uppercase tracking-tight">
                                                    {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: ptBR })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {hasUserUpdate && (
                                                    <button
                                                        onClick={() => { setEditingEmployee(user); setIsModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                {hasUserDelete && (
                                                    <button 
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all"
                                                        title="Remover"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                                <button className="p-2 text-slate-300 hover:text-slate-600 rounded-sm transition-colors">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Mostrando {users.length} de {usersData?.pagination?.total || users.length} Membros
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-1.5 border border-slate-200 bg-white rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all">Anterior</button>
                        <button className="px-4 py-1.5 border border-slate-200 bg-white rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">Próximo</button>
                    </div>
                </div>
            </div>

            <EmployeeModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingEmployee(null); }}
                employee={editingEmployee}
            />
        </div>
    );
}
