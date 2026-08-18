'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useBillingCustomers } from '@/hooks/module/billing';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/forms/Button';
import { Card, CardContent } from '@/components/ui/card';
import { CreateCustomerModal } from './components/CreateCustomerModal';
import { EditCustomerModal } from './components/EditCustomerModal';
import { DeleteCustomerModal } from './components/DeleteCustomerModal';
import { 
    Users, 
    MoreVertical, 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    Plus, 
    Edit2, 
    Trash2,
    Search,
    Mail,
    MapPin,
    Download,
    Filter
} from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function CustomersPage() {
    const [searchTerm, setSearchTerm] = useState('');

    // Modals state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Selected customer for Edit/Delete
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    const { data: customersData, isLoading, error } = useBillingCustomers({ search: searchTerm });
    const customers = customersData?.data || [];

    const handleOpenCreate = () => {
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (customer: any) => {
        setSelectedCustomer(customer);
        setIsEditOpen(true);
    };

    const handleOpenDelete = (customer: any) => {
        setSelectedCustomer(customer);
        setIsDeleteOpen(true);
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Gestão de Clientes
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Registe e gira a base de dados de clientes da sua organização.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={16} />
                        Novo Cliente
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Pesquisar por nome, NIF ou email..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-sm text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex-1 md:flex-none justify-center">
                        <Filter size={16} />
                        Filtros
                    </button>
                    <select className="bg-white border border-slate-200 rounded-sm py-2 px-4 text-sm font-bold text-slate-600 outline-none focus:border-primary transition-all cursor-pointer flex-1 md:flex-none">
                        <option>Todos os Clientes</option>
                        <option>Ativos</option>
                        <option>Inativos</option>
                    </select>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm min-h-100 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contactos / NIF</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="text-primary animate-spin" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando clientes...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-red-500 font-bold uppercase tracking-widest text-xs">
                                        Erro ao carregar base de dados de clientes.
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum cliente encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer: any) => (
                                    <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/5 uppercase">
                                                    {customer.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 leading-none">{customer.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-1.5 text-slate-400">
                                                        <MapPin size={12} />
                                                        <p className="text-[10px] font-bold uppercase tracking-tight">{customer.address || 'Sem endereço'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                                    <Mail size={12} className="text-slate-400" />
                                                    {customer.email || 'N/A'}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">NIF: {customer.nif || '999999999'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider border",
                                                customer.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                            )}>
                                                {customer.isActive ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                {customer.isActive ? 'Ativo' : 'Inativo'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button 
                                                    onClick={() => handleOpenEdit(customer)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                    title="Editar Cliente"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm transition-all">
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 p-1 shadow-xl border-slate-200 rounded-sm">
                                                        <DropdownMenuItem onClick={() => handleOpenEdit(customer)} className="gap-2 text-slate-600 focus:text-slate-900 focus:bg-slate-50 cursor-pointer rounded-sm font-bold text-xs uppercase tracking-wider">
                                                            <Edit2 size={14} />
                                                            Editar Dados
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-slate-100 my-1" />
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenDelete(customer)}
                                                            className="gap-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer rounded-sm font-bold text-xs uppercase tracking-wider"
                                                        >
                                                            <Trash2 size={14} />
                                                            Remover Cliente
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Total: {customers.length} clientes encontrados
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-sm text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all">Anterior</button>
                        <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-sm text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">Próximo</button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CreateCustomerModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />

            <EditCustomerModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                customer={selectedCustomer}
            />

            <DeleteCustomerModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                customer={selectedCustomer}
            />
        </div>
    );
}
