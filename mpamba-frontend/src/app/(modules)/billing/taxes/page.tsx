'use client';

import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    Filter,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    ArrowRight,
    TrendingUp,
    PencilLine,
    Trash2,
    Loader2,
    Percent,
    RefreshCw,
    Hash,
    Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/common/forms/Button';
import Input from '@/components/common/forms/Input';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
    useBillingTaxRules,
    useCreateBillingTaxRule,
    useDeleteBillingTaxRule,
    useUpdateBillingTaxRule,
} from '@/hooks/module/billing';
import { TaxRuleSchema, type CreateTaxRuleDto, type UpdateTaxRuleDto } from '@/shared/dto/billing.dto';
import type { TaxRule, TaxRuleKind, TaxRuleScope } from '@/shared/types/billing.types';

const taxKindLabel: Record<TaxRuleKind, string> = {
    TAX: 'Imposto',
    RETENTION: 'Retenção',
    EXEMPTION: 'Isenção',
};

const taxScopeLabel: Record<TaxRuleScope, string> = {
    GLOBAL: 'Global',
    CUSTOMER: 'Cliente',
    CUSTOMER_CATEGORY: 'Categoria de cliente',
    SERVICE: 'Serviço',
    SERVICE_CATEGORY: 'Categoria de serviço',
};

function kindTone(kind: TaxRuleKind) {
    switch (kind) {
        case 'TAX':
            return 'bg-blue-50 text-blue-700 border-blue-100';
        case 'RETENTION':
            return 'bg-amber-50 text-amber-700 border-amber-100';
        default:
            return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
}

function statusStyle(status: string) {
    switch (status) {
        case 'ACTIVE':
            return { label: 'Ativo', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 };
        case 'DRAFT':
            return { label: 'Rascunho', className: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock };
        default:
            return { label: status, className: 'bg-slate-50 text-slate-600 border-slate-200', icon: FileText };
    }
}

export default function BillingTaxesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingRule, setEditingRule] = useState<TaxRule | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: taxRules = [], isLoading, isFetching, refetch } = useBillingTaxRules();
    const { mutate: createTaxRule, isPending: isCreating } = useCreateBillingTaxRule();
    const { mutate: updateTaxRule, isPending: isUpdating } = useUpdateBillingTaxRule();
    const { mutate: deleteTaxRule, isPending: isDeleting } = useDeleteBillingTaxRule();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(TaxRuleSchema) as any,
        defaultValues: {
            name: '',
            kind: 'TAX',
            scope: 'GLOBAL',
            targetValue: '',
            rate: 14,
            priority: 100,
            isActive: true,
        },
    });

    const currentScope = watch('scope');

    const filteredRules = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return taxRules;
        return taxRules.filter((rule) =>
            [rule.name, rule.kind, rule.scope, rule.targetValue ?? '']
                .join(' ')
                .toLowerCase()
                .includes(query)
        );
    }, [taxRules, searchTerm]);

    const openCreateDialog = () => {
        setEditingRule(null);
        reset({
            name: '',
            kind: 'TAX',
            scope: 'GLOBAL',
            targetValue: '',
            rate: 14,
            priority: 100,
            isActive: true,
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (rule: TaxRule) => {
        setEditingRule(rule);
        reset({
            name: rule.name,
            kind: rule.kind,
            scope: rule.scope,
            targetValue: rule.targetValue ?? '',
            rate: rule.rate,
            priority: rule.priority,
            isActive: rule.isActive,
        });
        setIsDialogOpen(true);
    };

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            targetValue: data.scope === 'GLOBAL' ? null : data.targetValue ?? null,
        };

        if (editingRule) {
            updateTaxRule(
                { id: editingRule.id, data: payload as UpdateTaxRuleDto },
                {
                    onSuccess: () => {
                        toast.success('Regra fiscal atualizada');
                        setIsDialogOpen(false);
                        setEditingRule(null);
                    },
                    onError: (error: any) => toast.error(error?.message || 'Falha ao atualizar regra fiscal'),
                }
            );
            return;
        }

        createTaxRule(payload as CreateTaxRuleDto, {
            onSuccess: () => {
                toast.success('Regra fiscal criada');
                setIsDialogOpen(false);
                reset();
            },
            onError: (error: any) => toast.error(error?.message || 'Falha ao criar regra fiscal'),
        });
    };

    const handleDelete = (rule: TaxRule) => {
        if (!confirm(`Desativar a regra "${rule.name}"?`)) return;

        deleteTaxRule(rule.id, {
            onSuccess: () => toast.success('Regra fiscal desativada'),
            onError: (error: any) => toast.error(error?.message || 'Falha ao desativar regra fiscal'),
        });
    };

    const activeCount = taxRules.filter((rule) => rule.isActive).length;
    const globalRule = taxRules.find((rule) => rule.scope === 'GLOBAL' && rule.kind === 'TAX');
    const exceptionCount = taxRules.filter((rule) => rule.kind !== 'TAX' || rule.scope !== 'GLOBAL').length;
    const summaryCards = [
        { label: 'Taxas ativas', value: activeCount.toString(), detail: 'regras fiscais em vigor', icon: ShieldCheck, tone: 'emerald' },
        { label: 'Regra principal', value: globalRule ? `${globalRule.rate}%` : '--', detail: 'IVA padrão do sistema', icon: Percent, tone: 'blue' },
        { label: 'Exceções', value: exceptionCount.toString(), detail: 'isenções e retenções', icon: AlertCircle, tone: 'amber' },
        { label: 'Atualização', value: isFetching ? '...' : 'OK', detail: 'sincronização com backend', icon: Clock, tone: 'rose' },
    ];

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Configurações de Impostos
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gerencie IVA, retenções e regras fiscais aplicadas automaticamente.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/billing/settings')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-sm text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Configurações
                    </button>
                    <button 
                        onClick={openCreateDialog}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-sm font-bold text-sm hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={16} />
                        Nova Regra Fiscal
                    </button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {summaryCards.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.label} className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className={cn(
                                    'p-2 rounded-sm', 
                                    item.tone === 'emerald' && 'bg-emerald-50 text-emerald-600', 
                                    item.tone === 'blue' && 'bg-blue-50 text-blue-600', 
                                    item.tone === 'amber' && 'bg-amber-50 text-amber-600', 
                                    item.tone === 'rose' && 'bg-rose-50 text-rose-600'
                                )}>
                                    <Icon size={18} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                            </div>
                            <div className="mt-4">
                                <p className="text-2xl font-black text-slate-900 leading-none">{item.value}</p>
                                <p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-tight">{item.detail}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Taxes Table */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm min-h-100 flex flex-col">
                <div className="px-6 py-4 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={14} />
                        Lista de Regras Fiscais
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Pesquisar..."
                                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-sm text-xs font-medium focus:ring-1 focus:ring-primary outline-none transition-all w-48"
                            />
                        </div>
                        <button onClick={() => refetch()} className="p-2 text-slate-400 hover:text-primary transition-all">
                            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Regra / Nome</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Taxa</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Escopo / Alvo</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="text-primary animate-spin" />
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando regras fiscais...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRules.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma regra fiscal encontrada.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRules.map((rule) => {
                                    const badge = statusStyle(rule.isActive ? 'ACTIVE' : 'DRAFT');
                                    const StatusIcon = badge.icon;
                                    return (
                                        <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        'w-8 h-8 rounded-sm flex items-center justify-center text-[10px] font-bold border uppercase tracking-tighter',
                                                        kindTone(rule.kind)
                                                    )}>
                                                        {rule.kind === 'TAX' ? 'TX' : rule.kind === 'RETENTION' ? 'RT' : 'EX'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-none">{rule.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-tight">
                                                            {taxKindLabel[rule.kind]}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-sm font-black text-slate-900">{rule.rate}%</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-tight">
                                                        <Globe size={12} className="text-slate-400" />
                                                        {taxScopeLabel[rule.scope]}
                                                    </div>
                                                    {rule.targetValue && (
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            <Hash size={10} />
                                                            {rule.targetValue}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={cn(
                                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold border uppercase tracking-wider',
                                                    badge.className
                                                )}>
                                                    <StatusIcon size={12} />
                                                    {badge.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openEditDialog(rule)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-sm transition-all"
                                                        title="Editar Regra"
                                                    >
                                                        <PencilLine size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(rule)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all"
                                                        title="Desativar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                             <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Total: {filteredRules.length} regras configuradas
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        As regras são aplicadas por ordem de prioridade.
                    </p>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl rounded-sm">
                    <DialogHeader>
                        <DialogTitle>{editingRule ? 'Editar regra fiscal' : 'Nova regra fiscal'}</DialogTitle>
                        <DialogDescription>
                            Defina uma regra por cliente, categoria, serviço ou global para ser aplicada automaticamente.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome</label>
                                <Input {...register('name')} className="h-11 border-slate-200 rounded-sm" />
                                {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase">{String(errors.name.message ?? '')}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tipo</label>
                                <select {...register('kind')} className="h-11 w-full border border-slate-200 rounded-sm px-3 bg-white text-sm">
                                    <option value="TAX">Imposto</option>
                                    <option value="RETENTION">Retenção</option>
                                    <option value="EXEMPTION">Isenção</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Escopo</label>
                                <select {...register('scope')} className="h-11 w-full border border-slate-200 rounded-sm px-3 bg-white text-sm">
                                    <option value="GLOBAL">Global</option>
                                    <option value="CUSTOMER">Cliente</option>
                                    <option value="CUSTOMER_CATEGORY">Categoria de cliente</option>
                                    <option value="SERVICE">Serviço</option>
                                    <option value="SERVICE_CATEGORY">Categoria de serviço</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Valor alvo</label>
                                <Input {...register('targetValue')} className="h-11 border-slate-200 rounded-sm" placeholder={currentScope === 'GLOBAL' ? 'Não aplicável' : 'ID ou categoria'} />
                                {errors.targetValue && <p className="text-[10px] text-red-500 font-bold uppercase">{String(errors.targetValue.message ?? '')}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Taxa (%)</label>
                                <Input type="number" step="0.01" {...register('rate', { valueAsNumber: true })} className="h-11 border-slate-200 rounded-sm" />
                                {errors.rate && <p className="text-[10px] text-red-500 font-bold uppercase">{String(errors.rate.message ?? '')}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Prioridade</label>
                                <Input type="number" {...register('priority', { valueAsNumber: true })} className="h-11 border-slate-200 rounded-sm" />
                                {errors.priority && <p className="text-[10px] text-red-500 font-bold uppercase">{String(errors.priority.message ?? '')}</p>}
                            </div>
                            <div className="space-y-2 flex items-center gap-3 pt-7">
                                <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-slate-300 text-primary" />
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ativa</label>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                fullWidth={false}
                                onClick={() => setIsDialogOpen(false)}
                                className="border-slate-200 rounded-sm"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                fullWidth={false}
                                className="bg-primary hover:bg-primary-hover text-white rounded-sm gap-2"
                                disabled={isCreating || isUpdating}
                            >
                                {isCreating || isUpdating ? <Loader2 size={16} className="animate-spin" /> : null}
                                {editingRule ? 'Guardar Alterações' : 'Criar Regra'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}