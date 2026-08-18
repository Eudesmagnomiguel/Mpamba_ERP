'use client';

import { useState } from 'react';
import { 
    Lock, 
    Plus, 
    Search,
    Edit3,
    Trash2,
    ShieldCheck,
    Loader2,
    AlertCircle,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { useRoles, useDeleteRole, useAttachPermissionToRole, useDetachPermissionFromRole } from '@/hooks/core/useRole';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/core/usePermission';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import CreateRoleModal from '@/components/admin/roles/modals/CreateRoleModal';
import EditRoleModal from '@/components/admin/roles/modals/EditRoleModal';
import DeleteModal from '@/components/common/modals/DeleteModal';
import AddPermissionToRoleModal from '@/components/admin/roles/modals/AddPermissionToRoleModal';

export default function RolesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddPermissionModalOpen, setIsAddPermissionModalOpen] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [selectedRoleName, setSelectedRoleName] = useState('');
    const [selectedRolePermissions, setSelectedRolePermissions] = useState<any[]>([]);
    
    const { data: rolesData, isLoading, isError } = useRoles();
    const { data: permissionsData } = usePermissions({ pageSize: 500 });
    
    const deleteRoleMutation = useDeleteRole();
    const attachPermissionMutation = useAttachPermissionToRole();
    const detachPermissionMutation = useDetachPermissionFromRole();

    const user = useAuthStore(state => state.user);
    const hasRoleCreate = user?.permissions?.includes(PERMISSIONS.ROLE_CREATE);
    const hasRoleUpdate = user?.permissions?.includes(PERMISSIONS.ROLE_UPDATE);
    const hasRoleDelete = user?.permissions?.includes(PERMISSIONS.ROLE_DELETE);
    const hasRolePermissionUpdate = user?.permissions?.includes(PERMISSIONS.ROLE_PERMISSION_UPDATE);

    const roles = rolesData?.data?.filter(role => 
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const allPermissions = permissionsData?.data || [];

    const totalRoles = rolesData?.data?.length || 0;
    const totalPermissionsAssigned = rolesData?.data?.reduce((sum, role) => 
        sum + (role.permissions?.length || 0), 0
    ) || 0;

    const handleOpenEditModal = (roleId: string) => {
        setSelectedRoleId(roleId);
        setIsEditModalOpen(true);
    };

    const handleOpenDeleteModal = (roleId: string, roleName: string) => {
        setSelectedRoleId(roleId);
        setSelectedRoleName(roleName);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsAddPermissionModalOpen(false);
        setSelectedRoleId(null);
        setSelectedRoleName('');
        setSelectedRolePermissions([]);
    };

    const handleDeleteRole = async () => {
        if (!selectedRoleId) return;
        try {
            await deleteRoleMutation.mutateAsync(selectedRoleId);
            toast.success(`Papel "${selectedRoleName}" deletado com sucesso!`);
            handleCloseModals();
        } catch (error: any) {
            console.error('Error deleting role:', error);
            const message = error.response?.data?.message || 'Ocorreu um erro ao deletar o papel.';
            toast.error(message);
        }
    };

    const handleTogglePermission = async (roleId: string, currentPermissions: any[], permissionIdToToggle: string) => {
        if (!hasRolePermissionUpdate) {
            toast.error('Você não tem permissão para alterar as permissões deste papel.');
            return;
        }

        try {
            const hasPermission = currentPermissions.some(p => p.permissionId === permissionIdToToggle);
            
            if (hasPermission) {
                await detachPermissionMutation.mutateAsync({ roleId, permissionId: permissionIdToToggle });
                toast.success('Permissão removida com sucesso!');
            } else {
                await attachPermissionMutation.mutateAsync({ roleId, permissionId: permissionIdToToggle });
                toast.success('Permissão adicionada com sucesso!');
            }
        } catch (error: any) {
            console.error('Error updating role permissions:', error);
            toast.error(error.response?.data?.message || 'Erro ao atualizar permissões do papel.');
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Papéis (Roles)</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Defina os níveis de acesso e permissões para os usuários do sistema.</p>
                </div>

                {hasRoleCreate && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={18} />
                        Novo Papel
                    </button>
                )}
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/5 text-primary rounded-sm flex items-center justify-center">
                        <Lock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Papéis</p>
                        <h3 className="text-xl font-bold text-slate-900">{totalRoles}</h3>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-sm flex items-center justify-center">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permissões Atribuídas</p>
                        <h3 className="text-xl font-bold text-slate-900">{totalPermissionsAssigned}</h3>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Pesquisar papéis..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Roles Grid (Cards) */}
            <div className="mt-6">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center gap-3 bg-white border border-slate-200 rounded-sm shadow-sm">
                        <Loader2 size={40} className="text-primary animate-spin" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando papéis...</p>
                    </div>
                ) : isError ? (
                    <div className="py-20 flex flex-col items-center gap-3 bg-white border border-slate-200 rounded-sm shadow-sm">
                        <AlertCircle size={40} className="text-red-500" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Erro ao carregar papéis</p>
                    </div>
                ) : roles.length === 0 ? (
                    <div className="py-20 text-center bg-white border border-slate-200 rounded-sm shadow-sm">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum papel encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {roles.map((role) => {
                            return (
                                <div key={role.id} className="bg-white border border-slate-200 rounded-sm p-5 hover:border-primary/30 hover:shadow-md transition-all flex flex-col relative group">
                                    <div className="flex items-start justify-between gap-2 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center font-bold border border-primary/10 shrink-0">
                                                <Lock size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 leading-tight">{role.name}</h3>
                                                <p className="text-xs text-slate-500 mt-1 font-medium line-clamp-2" title={role.description || ''}>
                                                    {role.description || 'Sem descrição'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {hasRoleUpdate && (
                                                <button 
                                                    onClick={() => handleOpenEditModal(role.id)}
                                                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                    title="Editar papel"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                            )}
                                            {hasRoleDelete && (
                                                <button 
                                                    onClick={() => handleOpenDeleteModal(role.id, role.name)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-all"
                                                    title="Excluir papel"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-100 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Permissões ({role.permissions?.length || 0})
                                            </p>
                                            
                                            {hasRolePermissionUpdate && (
                                                <button 
                                                    onClick={() => {
                                                        setSelectedRoleId(role.id);
                                                        setSelectedRoleName(role.name);
                                                        setSelectedRolePermissions(role.permissions || []);
                                                        setIsAddPermissionModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 text-primary rounded-sm text-[10px] font-black uppercase tracking-tighter hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/10"
                                                    title="Adicionar permissão ao papel"
                                                    disabled={attachPermissionMutation.isPending}
                                                >
                                                    <Plus size={12} strokeWidth={3} />
                                                    Adicionar
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 pb-1">
                                            {(role.permissions?.length || 0) === 0 ? (
                                                <span className="text-[11px] text-slate-400 italic">Nenhuma permissão atribuída</span>
                                            ) : (
                                                role.permissions?.map((item: any) => (
                                                    <button
                                                        key={item.permissionId}
                                                        type="button"
                                                        onClick={() => hasRolePermissionUpdate && handleTogglePermission(role.id, role.permissions || [], item.permissionId)}
                                                        className={`inline-flex items-center gap-1.5 px-2 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded-sm text-[10px] font-bold transition-all ${hasRolePermissionUpdate ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-200 group/btn cursor-pointer' : 'cursor-default'}`}
                                                        title={hasRolePermissionUpdate ? "Clique para remover permissão" : "Permissão atribuída"}
                                                        disabled={!hasRolePermissionUpdate || detachPermissionMutation.isPending}
                                                    >
                                                        <ShieldCheck className={`w-3.5 h-3.5 ${hasRolePermissionUpdate ? 'group-hover/btn:hidden' : ''}`} />
                                                        {hasRolePermissionUpdate && <X className="w-3.5 h-3.5 hidden group-hover/btn:block" />}
                                                        {item.permission.code}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateRoleModal 
                isOpen={isCreateModalOpen}
                onClose={handleCloseModals}
            />
            <EditRoleModal 
                isOpen={isEditModalOpen}
                roleId={selectedRoleId}
                onClose={handleCloseModals}
            />
            <DeleteModal
                isOpen={isDeleteModalOpen}
                itemName={selectedRoleName}
                itemType="Papel"
                onConfirm={handleDeleteRole}
                onClose={handleCloseModals}
                isLoading={deleteRoleMutation.isPending}
                isDangerous={true}
            />
            <AddPermissionToRoleModal 
                isOpen={isAddPermissionModalOpen}
                onClose={handleCloseModals}
                roleId={selectedRoleId}
                roleName={selectedRoleName}
                availablePermissions={allPermissions.filter(p => !roles.find(r => r.id === selectedRoleId)?.permissions?.some((rp: any) => rp.permissionId === p.id))}
                onAdd={(permissionId) => handleTogglePermission(selectedRoleId!, selectedRolePermissions, permissionId)}
                isPending={attachPermissionMutation.isPending}
            />
        </div>
    );
}
