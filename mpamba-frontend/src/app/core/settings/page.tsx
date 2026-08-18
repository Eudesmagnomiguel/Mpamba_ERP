'use client';

import { useEffect, useState } from 'react';
import { Building2, Receipt, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/forms/Button';
import { useMyOrganization, useUpdateMyOrganization } from '@/hooks/module/organization';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import { useAuthStore } from '@/store/auth.store';

export default function CoreSettingsPage() {
    const { data: org, isLoading } = useMyOrganization();
    const updateMutation = useUpdateMyOrganization();
    const authUser = useAuthStore(state => state.user);
    const updateAuthUser = useAuthStore(state => state.updateUser);
    const canUpdate = authUser?.permissions?.includes(PERMISSIONS.SETTING_UPDATE);

    const [name, setName] = useState('');
    const [nif, setNif] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [invoiceFooterNote, setInvoiceFooterNote] = useState('');
    const [invoiceDueDays, setInvoiceDueDays] = useState(30);
    const [posInvoiceThreshold, setPosInvoiceThreshold] = useState(50000);

    useEffect(() => {
        if (!org) return;
        setName(org.name || '');
        setNif(org.nif || '');
        setAddress(org.address || '');
        setPhone(org.phone || '');
        setEmail(org.email || '');
        setInvoiceFooterNote(org.invoiceFooterNote || '');
        setInvoiceDueDays(org.invoiceDueDays ?? 30);
        setPosInvoiceThreshold(org.posInvoiceThreshold ?? 50000);
    }, [org]);

    const handleSaveOrg = async () => {
        try {
            await updateMutation.mutateAsync({ name, nif, address, phone, email });
            if (authUser?.organization) {
                updateAuthUser({ organization: { ...authUser.organization, name, nif } });
            }
            toast.success('Dados da organização atualizados!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao atualizar dados da organização.');
        }
    };

    const handleSaveBilling = async () => {
        try {
            await updateMutation.mutateAsync({ invoiceFooterNote, invoiceDueDays, posInvoiceThreshold });
            toast.success('Parametrização de faturação atualizada!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao atualizar parametrização.');
        }
    };

    if (isLoading) {
        return (
            <div className="py-24 flex flex-col items-center gap-3">
                <Loader2 size={28} className="text-primary animate-spin" />
                <p className="text-xs text-slate-400">A carregar parametrização…</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-16">
            <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Parametrização</p>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Configurações da Organização</h1>
                <p className="text-slate-500 text-sm mt-1">Dados da empresa e preferências de faturação.</p>
            </div>

            {/* ── DADOS DA ORGANIZAÇÃO ── */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <Building2 size={16} className="text-primary" />
                    <h2 className="text-sm font-bold text-slate-800">Dados da Organização</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Nome da Empresa" value={name} onChange={(e) => setName(e.target.value)} disabled={!canUpdate} />
                        <Input label="NIF" value={nif} onChange={(e) => setNif(e.target.value)} disabled={!canUpdate} />
                    </div>
                    <Input label="Morada" value={address} onChange={(e) => setAddress(e.target.value)} disabled={!canUpdate} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canUpdate} />
                        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canUpdate} />
                    </div>

                    {canUpdate && (
                        <div className="flex justify-end pt-2">
                            <Button
                                type="button"
                                fullWidth={false}
                                onClick={handleSaveOrg}
                                disabled={updateMutation.isPending}
                                icon={updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                iconPosition="end"
                            >
                                {updateMutation.isPending ? 'A guardar…' : 'Guardar dados'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PARAMETRIZAÇÃO DE FATURAÇÃO ── */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <Receipt size={16} className="text-primary" />
                    <h2 className="text-sm font-bold text-slate-800">Parametrização de Faturação</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-primary mb-1.5 block">Prazo de vencimento padrão (dias)</label>
                        <input
                            type="number"
                            min={0}
                            max={365}
                            value={invoiceDueDays}
                            onChange={(e) => setInvoiceDueDays(Math.max(0, Math.min(365, parseInt(e.target.value) || 0)))}
                            disabled={!canUpdate}
                            className="w-full sm:w-40 h-11 bg-white border border-slate-200 rounded-sm px-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5">Novas faturas terão automaticamente esta data de vencimento, a partir da data de emissão.</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-primary mb-1.5 block">Limiar Posto de Venda: fatura vs recibo (AOA)</label>
                        <input
                            type="number"
                            min={0}
                            step="100"
                            value={posInvoiceThreshold}
                            onChange={(e) => setPosInvoiceThreshold(Math.max(0, parseFloat(e.target.value) || 0))}
                            disabled={!canUpdate}
                            className="w-full sm:w-48 h-11 bg-white border border-slate-200 rounded-sm px-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            No Posto de Venda, vendas a partir deste valor emitem Fatura; abaixo deste valor emitem apenas Recibo.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-primary mb-1.5 block">Nota de rodapé da fatura</label>
                        <textarea
                            value={invoiceFooterNote}
                            onChange={(e) => setInvoiceFooterNote(e.target.value)}
                            disabled={!canUpdate}
                            placeholder="Ex: dados bancários para pagamento, condições gerais, agradecimento…"
                            className="w-full bg-white border border-slate-200 rounded-sm p-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[100px] resize-none disabled:bg-slate-50 disabled:text-slate-400"
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5">Este texto aparece no rodapé de todas as faturas emitidas.</p>
                    </div>

                    {canUpdate && (
                        <div className="flex justify-end pt-2">
                            <Button
                                type="button"
                                fullWidth={false}
                                onClick={handleSaveBilling}
                                disabled={updateMutation.isPending}
                                icon={updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                iconPosition="end"
                            >
                                {updateMutation.isPending ? 'A guardar…' : 'Guardar parametrização'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
