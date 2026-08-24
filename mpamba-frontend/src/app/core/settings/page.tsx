'use client';

import { useEffect, useState } from 'react';
import { Building2, Receipt, Landmark, Loader2, Save, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/forms/Button';
import { useMyOrganization, useUpdateMyOrganization, useUpdateMyOrganizationLogo } from '@/hooks/module/organization';
import { PERMISSIONS } from '@/shared/constants/permission.constants';
import { useAuthStore } from '@/store/auth.store';

export default function CoreSettingsPage() {
    const { data: org, isLoading } = useMyOrganization();
    const updateMutation = useUpdateMyOrganization();
    const logoMutation = useUpdateMyOrganizationLogo();
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
    // Dados de emitente e fiscais impressos na factura (formato AGT)
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('Angola');
    const [fax, setFax] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [iban, setIban] = useState('');
    const [agtValidationNumber, setAgtValidationNumber] = useState('');
    const [taxExemptionCode, setTaxExemptionCode] = useState('');
    const [taxExemptionReason, setTaxExemptionReason] = useState('');
    const [retentionEntity, setRetentionEntity] = useState('');
    const [retentionRate, setRetentionRate] = useState(0);

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
        setCity(org.city || '');
        setPostalCode(org.postalCode || '');
        setCountry(org.country || 'Angola');
        setFax(org.fax || '');
        setLogoUrl(org.logoUrl || '');
        setBankName(org.bankName || '');
        setBankAccount(org.bankAccount || '');
        setIban(org.iban || '');
        setAgtValidationNumber(org.agtValidationNumber || '');
        setTaxExemptionCode(org.taxExemptionCode || '');
        setTaxExemptionReason(org.taxExemptionReason || '');
        setRetentionEntity(org.retentionEntity || '');
        setRetentionRate(org.retentionRate ?? 0);
    }, [org]);

    const handleSaveOrg = async () => {
        try {
            await updateMutation.mutateAsync({
                name, nif, address, phone, email,
                city, postalCode, country, fax,
            });
            if (authUser?.organization) {
                updateAuthUser({ organization: { ...authUser.organization, name, nif } });
            }
            toast.success('Dados da organização atualizados!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao atualizar dados da organização.');
        }
    };

    const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB

    const handleLogoFile = async (file: File | undefined) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('O ficheiro tem de ser uma imagem (PNG, JPG, GIF ou WebP).');
            return;
        }
        if (file.size > MAX_LOGO_BYTES) {
            toast.error('Imagem demasiado grande. Use um ficheiro até 1 MB.');
            return;
        }

        // A imagem viaja como data URI porque o alojamento serverless não tem
        // disco persistente: fica guardada na organização e sobrevive aos deploys.
        const dataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });

        try {
            await logoMutation.mutateAsync(dataUri);
            setLogoUrl(dataUri);
            toast.success('Logótipo atualizado!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao guardar o logótipo.');
        }
    };

    const handleLogoUrl = async () => {
        try {
            await logoMutation.mutateAsync(logoUrl);
            toast.success('Logótipo atualizado!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao guardar o logótipo.');
        }
    };

    const handleRemoveLogo = async () => {
        try {
            await updateMutation.mutateAsync({ logoUrl: '' });
            setLogoUrl('');
            toast.success('Logótipo removido.');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao remover o logótipo.');
        }
    };

    const handleSaveFiscal = async () => {
        try {
            await updateMutation.mutateAsync({
                bankName, bankAccount, iban,
                agtValidationNumber, taxExemptionCode, taxExemptionReason,
                retentionEntity, retentionRate,
            });
            toast.success('Dados fiscais da factura atualizados!');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao atualizar dados fiscais.');
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} disabled={!canUpdate} />
                        <Input label="Código Postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} disabled={!canUpdate} />
                        <Input label="País" value={country} onChange={(e) => setCountry(e.target.value)} disabled={!canUpdate} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canUpdate} />
                        <Input label="Fax" value={fax} onChange={(e) => setFax(e.target.value)} disabled={!canUpdate} />
                    </div>
                    <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canUpdate} />

                    {/* ── LOGÓTIPO DA FACTURA ── */}
                    <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold text-primary">Logótipo da factura</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Aparece no canto superior esquerdo da factura. Envie um ficheiro (até 1 MB) ou indique um URL.
                                </p>
                            </div>
                            {logoUrl && (
                                <div className="flex items-center gap-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={logoUrl}
                                        alt="Logótipo da organização"
                                        className="h-12 w-auto max-w-[140px] object-contain border border-slate-100 rounded bg-white"
                                    />
                                    {canUpdate && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            title="Remover logótipo"
                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {canUpdate && (
                            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                                <label className="inline-flex items-center gap-2 h-11 px-4 border border-slate-200 rounded-sm text-sm text-slate-600 cursor-pointer hover:border-primary hover:text-primary transition-colors shrink-0">
                                    {logoMutation.isPending
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Upload className="w-4 h-4" />}
                                    Carregar ficheiro
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/gif,image/webp"
                                        className="hidden"
                                        onChange={(e) => handleLogoFile(e.target.files?.[0])}
                                    />
                                </label>

                                <div className="flex-1 flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Input
                                            label="…ou URL da imagem"
                                            value={logoUrl.startsWith('data:') ? '' : logoUrl}
                                            placeholder="https://exemplo.ao/logo.png"
                                            onChange={(e) => setLogoUrl(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        fullWidth={false}
                                        onClick={handleLogoUrl}
                                        disabled={!logoUrl || logoUrl.startsWith('data:') || logoMutation.isPending}
                                    >
                                        Usar URL
                                    </Button>
                                </div>
                            </div>
                        )}
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

            {/* ── DADOS FISCAIS E BANCÁRIOS DA FACTURA ── */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <Landmark size={16} className="text-primary" />
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">Dados Fiscais e Bancários da Factura</h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Aparecem impressos na factura, nos quadros exigidos pela AGT.
                        </p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <Input
                        label="N.º de validação do programa (AGT)"
                        value={agtValidationNumber}
                        onChange={(e) => setAgtValidationNumber(e.target.value)}
                        placeholder="Ex: 41/AGT/2019"
                        disabled={!canUpdate}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input label="Banco" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex: BAI" disabled={!canUpdate} />
                        <Input label="Conta n.º" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} disabled={!canUpdate} />
                        <Input label="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} disabled={!canUpdate} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            label="Código de isenção de IVA"
                            value={taxExemptionCode}
                            onChange={(e) => setTaxExemptionCode(e.target.value)}
                            placeholder="Ex: 00"
                            disabled={!canUpdate}
                        />
                        <div className="sm:col-span-2">
                            <Input
                                label="Motivo de isenção de IVA"
                                value={taxExemptionReason}
                                onChange={(e) => setTaxExemptionReason(e.target.value)}
                                placeholder="Ex: IVA - Regime Simplificado"
                                disabled={!canUpdate}
                            />
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 -mt-2">
                        Usados nas linhas com IVA a zero, onde a menção da norma de isenção é obrigatória.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <Input
                                label="Entidade de retenção na fonte"
                                value={retentionEntity}
                                onChange={(e) => setRetentionEntity(e.target.value)}
                                placeholder="Ex: RIR - Rendimentos Profissionais"
                                disabled={!canUpdate}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-primary mb-1.5 block">Taxa de retenção (%)</label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step="0.5"
                                value={retentionRate}
                                onChange={(e) => setRetentionRate(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                                disabled={!canUpdate}
                                className="w-full h-11 bg-white border border-slate-200 rounded-sm px-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                            />
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 -mt-2">
                        Aplicada à base tributável de cada nova factura e impressa no Quadro de Retenção. Deixe a zero se não houver retenção.
                    </p>

                    {canUpdate && (
                        <div className="flex justify-end pt-2">
                            <Button
                                type="button"
                                fullWidth={false}
                                onClick={handleSaveFiscal}
                                disabled={updateMutation.isPending}
                                icon={updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                iconPosition="end"
                            >
                                {updateMutation.isPending ? 'A guardar…' : 'Guardar dados fiscais'}
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
