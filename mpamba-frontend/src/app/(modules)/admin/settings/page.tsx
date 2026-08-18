'use client';

import { useState } from 'react';
import { 
    Globe, 
    Bell, 
    Palette, 
    Shield, 
    Save,
    Mail,
    Smartphone,
    Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FormInput from '@/components/common/forms/Input';
import FormButton from '@/components/common/forms/Button';

const tabs = [
    { id: 'general', name: 'Geral', icon: Globe },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'branding', name: 'Branding', icon: Palette },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configurações do Sistema</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Gerencie os parâmetros globais e a identidade da plataforma.</p>
                </div>

                <div className="flex items-center gap-3">
                   <FormButton 
                        variant="outline" 
                        fullWidth={false} 
                        className="bg-white border-slate-200 text-slate-600 px-6"
                    >
                        Descartar
                    </FormButton>
                    <FormButton 
                        icon={<Save size={18} />} 
                        fullWidth={false} 
                        className="px-8 shadow-md shadow-primary/20"
                    >
                        Salvar Alterações
                    </FormButton>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Tabs Sidebar */}
                <aside className="w-full lg:w-64 space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-bold transition-all",
                                activeTab === tab.id 
                                    ? "bg-primary text-white shadow-md shadow-primary/10" 
                                    : "text-slate-500 hover:bg-white hover:text-slate-900"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.name}
                        </button>
                    ))}
                </aside>

                {/* Content Area */}
                <main className="flex-1 space-y-6">
                    {activeTab === 'general' && (
                        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Informações da Plataforma</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput label="Nome da Plataforma" defaultValue="Mpamba Multi-Tenant" icon={<Globe size={16} />} />
                                    <FormInput label="URL de Acesso" defaultValue="https://admin.mpamba.com" icon={<Cloud size={16} />} />
                                    <FormInput label="Email de Suporte" defaultValue="suporte@mpamba.com" icon={<Mail size={16} />} />
                                    <FormInput label="Telefone de Contato" defaultValue="+244 9XX XXX XXX" icon={<Smartphone size={16} />} />
                                </div>
                                <div className="space-y-1.5 pt-4">
                                    <label className="block text-xs font-bold text-foreground uppercase tracking-widest">Estado de Manutenção</label>
                                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-sm border border-slate-100">
                                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200">
                                            <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition" />
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium italic">Ativar o modo de manutenção impedirá que organizações acessem seus painéis.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Políticas de Segurança</h3>
                            </div>
                            <div className="p-6 space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Autenticação de Dois Fatores (2FA)</h4>
                                    <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-sm">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-900">Exigir 2FA para Administradores</p>
                                            <p className="text-xs text-slate-500">Aumenta a segurança exigindo um código adicional no login.</p>
                                        </div>
                                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                                            <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Política de Senhas</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <select className="h-11 bg-slate-50 border border-slate-200 rounded-sm px-4 text-sm font-bold text-slate-600 outline-none focus:border-primary transition-all">
                                            <option>Mínimo 8 caracteres</option>
                                            <option>Mínimo 12 caracteres</option>
                                        </select>
                                        <select className="h-11 bg-slate-50 border border-slate-200 rounded-sm px-4 text-sm font-bold text-slate-600 outline-none focus:border-primary transition-all">
                                            <option>Exigir Símbolos e Números</option>
                                            <option>Apenas Alfanumérico</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional tabs would follow the same structure */}
                    {activeTab === 'notifications' && (
                         <div className="bg-white border border-slate-200 rounded-sm p-12 text-center shadow-sm">
                            <Bell size={48} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">Configurações de Notificação</h3>
                            <p className="text-slate-500 text-sm mt-1">Módulo em desenvolvimento.</p>
                         </div>
                    )}

                    {activeTab === 'branding' && (
                         <div className="bg-white border border-slate-200 rounded-sm p-12 text-center shadow-sm">
                            <Palette size={48} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">Customização Visual</h3>
                            <p className="text-slate-500 text-sm mt-1">Módulo em desenvolvimento.</p>
                         </div>
                    )}
                </main>
            </div>
        </div>
    );
}
