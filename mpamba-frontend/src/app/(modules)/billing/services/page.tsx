'use client';

import { useState } from 'react';
import { 
    Plus, 
    Search, 
    Filter, 
    Edit, 
    Trash2, 
    Package,
    X
} from 'lucide-react';
import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import { 
    useBillingServices, 
    useCreateBillingService, 
    useUpdateBillingService, 
    useDeleteBillingService 
} from '@/hooks/module/billing';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateServiceSchema, CreateServiceDto } from '@/shared/dto/billing.dto';
import { billingExportService } from '@/services/module/billing/export.service';
import { ExportExcelButton } from '@/components/common/ExportExcelButton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function BillingServicesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);

    const { data: servicesData, isLoading } = useBillingServices({ search: searchTerm });
    const { mutate: createService } = useCreateBillingService();
    const { mutate: updateService } = useUpdateBillingService();
    const { mutate: deleteService } = useDeleteBillingService();

    const services = servicesData?.data || [];

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<CreateServiceDto>({
        resolver: zodResolver(CreateServiceSchema),
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            taxRate: 14
        }
    });

    const onSubmit = (data: CreateServiceDto) => {
        if (editingService) {
            updateService({ id: editingService.id, data }, {
                onSuccess: () => {
                    toast.success('Serviço atualizado com sucesso');
                    setIsAddModalOpen(false);
                    setEditingService(null);
                    reset();
                }
            });
        } else {
            createService(data, {
                onSuccess: () => {
                    toast.success('Serviço criado com sucesso');
                    setIsAddModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleEdit = (service: any) => {
        setEditingService(service);
        reset({
            name: service.name,
            description: service.description || '',
            price: service.price,
            taxRate: service.taxRate
        });
        setIsAddModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja remover este serviço?')) {
            deleteService(id, {
                onSuccess: () => toast.success('Serviço removido com sucesso')
            });
        }
    };

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catálogo de Serviços</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gerencie os serviços e preçários oferecidos pela sua organização.</p>
                </div>

                <div className="flex items-center gap-3">
                    <ExportExcelButton
                        filename="servicos"
                        label="Exportar"
                        className="px-4 py-2 bg-white border-slate-200 rounded-sm text-slate-700 font-bold text-sm hover:bg-slate-50 shadow-sm"
                        fetchFile={() => billingExportService.exportServices({ search: searchTerm || undefined })}
                    />
                    <button 
                        onClick={() => {
                            setEditingService(null);
                            reset({ name: '', description: '', price: 0, taxRate: 14 });
                            setIsAddModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={16} />
                        Novo Serviço
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
                        placeholder="Pesquisar por nome ou descrição..." 
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
                        <option>Todas as Categorias</option>
                        <option>Consultoria</option>
                        <option>Manutenção</option>
                        <option>Software</option>
                    </select>
                </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-sm border border-slate-200" />
                    ))
                ) : services.length > 0 ? (
                    services.map((service: any) => (
                        <div key={service.id} className="bg-white border border-slate-200 rounded-sm hover:border-primary/40 transition-all hover:shadow-md group overflow-hidden">
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors border border-primary/5">
                                        <Package size={20} />
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleEdit(service)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                            title="Editar Serviço"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(service.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all"
                                            title="Remover"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1 text-sm uppercase tracking-tight">{service.name}</h3>
                                    <p className="text-[11px] font-medium text-slate-500 mt-2 line-clamp-2 min-h-[32px]">
                                        {service.description || 'Sem descrição detalhada.'}
                                    </p>
                                </div>
                                <div className="mt-5 pt-4 border-t border-slate-50 flex items-end justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço Base</span>
                                        <p className="text-xl font-black text-slate-900">
                                            {service.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxa IVA</span>
                                        <p className="text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-sm border border-primary/10 mt-1">
                                            {service.taxRate}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center bg-slate-50/50 rounded-sm border border-dashed border-slate-200">
                        <Package size={48} className="text-slate-200" />
                        <h3 className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum serviço encontrado</h3>
                        <p className="text-slate-500 text-xs font-medium mt-1">Comece adicionando seu primeiro serviço ao catálogo.</p>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-6 px-6 py-2 border border-primary text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all rounded-sm"
                        >
                            Adicionar Serviço
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Adição/Edição */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-sm">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900 font-bold">
                            {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Preencha os dados do serviço para o seu catálogo de faturação.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome do Serviço</label>
                            <Input 
                                {...register('name')}
                                placeholder="Ex: Consultoria Técnica"
                                className="h-11 border-slate-200 rounded-sm"
                            />
                            {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição (Opcional)</label>
                            <Input 
                                {...register('description')}
                                placeholder="Breve descrição do serviço..."
                                className="h-11 border-slate-200 rounded-sm"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Preço Base (Kz)</label>
                                <Input 
                                    type="number"
                                    {...register('price', { valueAsNumber: true })}
                                    className="h-11 border-slate-200 rounded-sm"
                                />
                                {errors.price && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.price.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Taxa IVA (%)</label>
                                <Input 
                                    type="number"
                                    {...register('taxRate', { valueAsNumber: true })}
                                    className="h-11 border-slate-200 rounded-sm"
                                />
                                {errors.taxRate && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.taxRate.message}</p>}
                            </div>
                        </div>
                        <DialogFooter className="pt-6">
                            <Button 
                                type="submit"
                                className="bg-primary hover:bg-primary-hover text-white rounded-sm"
                            >
                                {editingService ? 'Guardar Alterações' : 'Criar Serviço'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
