'use client';

import { useEffect, useState } from 'react';
import {
    Settings,
    User,
    LogOut,
    ChevronDown,
    ChevronRight,
    Menu,
    Boxes,
    Package,
    Receipt,
    Wallet,
    SlidersHorizontal,
    ShieldCheck,
    BookOpen,
    PanelLeftClose,
    PanelLeft,
    Clock,
    Sun,
    Moon
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useTheme } from '@/hooks/core/useTheme';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useLogout } from '@/hooks/core/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { useLayoutConfig } from './LayoutContext';

/* ─── Breadcrumb ──────────────────────────────────────────────── */

function Breadcrumb() {
    const pathname = usePathname();
    const { routeLabels = {} } = useLayoutConfig();
    const segments = pathname.split('/').filter(Boolean);

    return (
        <div className="hidden md:flex items-center gap-1 text-sm">
            {segments.map((seg, i) => {
                const isLast = i === segments.length - 1;
                const label = routeLabels[seg] ?? seg;
                return (
                    <span key={`${seg}-${i}`} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight size={13} className="text-slate-300 shrink-0" />}
                        <span
                            className={cn(
                                'transition-colors',
                                isLast ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium hover:text-slate-600'
                            )}
                        >
                            {label}
                        </span>
                    </span>
                );
            })}
        </div>
    );
}

/* ─── Clock ───────────────────────────────────────────────────── */

function HeaderClock() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!now) return null;

    const dateLabel = now.toLocaleDateString('pt-AO', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
    const timeLabel = now.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
        <div className="hidden md:flex items-center gap-2 pr-3 mr-1 border-r border-slate-100">
            <Clock size={14} className="text-accent-warm shrink-0" />
            <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-xs font-bold text-slate-600 capitalize">{dateLabel}</span>
                <span className="text-xs font-mono font-semibold text-slate-400 tabular-nums">{timeLabel}</span>
            </div>
        </div>
    );
}

/* ─── Props ───────────────────────────────────────────────────── */

interface HeaderProps {
    onToggleSidebar?: () => void;
    isSidebarCollapsed?: boolean;
    onToggleSidebarCollapse?: () => void;
}

/* ─── Header ──────────────────────────────────────────────────── */

export default function Header({ onToggleSidebar, isSidebarCollapsed, onToggleSidebarCollapse }: HeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModuleSwitcherOpen, setIsModuleSwitcherOpen] = useState(false);
    
    const router = useRouter();
    const pathname = usePathname();
    const { mutate: logout } = useLogout();
    const { theme, toggleTheme } = useTheme();
    const user = useAuthStore((state) => state.user);
    const { hasModule } = useModuleAccess();
    const { settingsHref } = useLayoutConfig();

    const userInitial = user?.name?.charAt(0)?.toUpperCase();
    const userRole = user?.role ?? 'Administrador';

    // Module detection — os ids têm de coincidir com os códigos reais de Module (backend), em minúsculas
    const currentModule = pathname.startsWith('/stock') ? 'stock' :
                         pathname.startsWith('/billing') ? 'faturacao' :
                         pathname.startsWith('/treasury') ? 'tesouraria' :
                         pathname.startsWith('/contabilidade') ? 'contabilidade' :
                         pathname.startsWith('/core') ? 'core' :
                         pathname.startsWith('/admin') ? 'admin' : 'sistema';

    // Módulos subscritos pela organização (dependem do plano/ativação)
    const modules = [
        { id: 'stock', label: 'Stock', icon: Package, href: '/stock', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'faturacao', label: 'Faturação', icon: Receipt, href: '/billing', color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'tesouraria', label: 'Tesouraria', icon: Wallet, href: '/treasury', color: 'text-amber-500', bg: 'bg-amber-50' },
        { id: 'contabilidade', label: 'Contabilidade', icon: BookOpen, href: '/contabilidade', color: 'text-violet-500', bg: 'bg-violet-50' },
    ];

    // Área sempre disponível para qualquer utilizador autenticado (não é um módulo subscrito)
    const coreModule = { id: 'core', label: 'Config Core', icon: SlidersHorizontal, href: '/core', color: 'text-primary', bg: 'bg-primary/10' };

    // Módulos que o utilizador realmente tem visibilidade: ativos na organização
    // E com pelo menos uma permissão RBAC atribuída dentro do módulo.
    const availableModules = modules.filter(m => hasModule(m.id));

    const allModulesById = [...modules, coreModule];
    const currentModuleInfo = allModulesById.find(m => m.id === currentModule) || { label: 'Mpamba ERP', icon: Boxes, color: 'text-slate-700', bg: 'bg-slate-100' };

    return (
        <header className="relative h-16 bg-white border-b border-slate-200/70 shadow-sm shadow-slate-200/40 px-4 md:px-6 flex items-center justify-between gap-4 z-30 shrink-0">
            <div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary via-accent-warm to-primary" />
            {/* Left: hamburger + breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full lg:hidden transition-colors shrink-0"
                    aria-label="Abrir menu"
                >
                    <Menu size={20} />
                </button>

                <button
                    onClick={onToggleSidebarCollapse}
                    className="hidden lg:inline-flex p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                    aria-label={isSidebarCollapsed ? 'Mostrar menu lateral' : 'Ocultar menu lateral'}
                    title={isSidebarCollapsed ? 'Mostrar menu lateral' : 'Ocultar menu lateral'}
                >
                    {isSidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                </button>

                {/* Module Switcher Button — não aplicável ao backoffice, que não pertence a uma organização */}
                {currentModule === 'admin' ? (
                    <div className="ml-1 hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-900 rounded-xl">
                        <div className="p-1 rounded-lg bg-white/10">
                            <ShieldCheck size={16} className="text-white" />
                        </div>
                        <span className="text-xs font-bold text-white tracking-tight">Backoffice</span>
                    </div>
                ) : (
                <div className="relative ml-1 hidden md:block">
                    <button
                        onClick={() => setIsModuleSwitcherOpen(!isModuleSwitcherOpen)}
                        className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
                    >
                        <div className={cn("p-1 rounded-lg transition-colors", currentModuleInfo.bg)}>
                            <currentModuleInfo.icon size={16} className={currentModuleInfo.color} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 tracking-tight">{currentModuleInfo.label}</span>
                        <ChevronDown size={12} className={cn("text-slate-400 transition-transform", isModuleSwitcherOpen && "rotate-180")} />
                    </button>

                    {isModuleSwitcherOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsModuleSwitcherOpen(false)} />
                            <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto">
                                <div className="px-3 py-2 mb-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Módulos Disponíveis</p>
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                    {availableModules.length === 0 ? (
                                        <div className="px-3 py-4 text-center">
                                            <p className="text-[11px] text-slate-400 font-medium">Nenhum módulo ativo para a sua organização.</p>
                                        </div>
                                    ) : (
                                        availableModules.map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    router.push(m.href);
                                                    setIsModuleSwitcherOpen(false);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group",
                                                    currentModule === m.id ? "bg-slate-50 border border-slate-100" : "hover:bg-slate-50 border border-transparent"
                                                )}
                                            >
                                                <div className={cn("p-2 rounded-lg transition-colors shadow-sm", m.bg)}>
                                                    <m.icon size={18} className={m.color} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-slate-800">{m.label}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Aceder ao painel de {m.label.toLowerCase()}</p>
                                                </div>
                                                {currentModule === m.id && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>

                                <div className="h-px bg-slate-100 my-2 mx-2" />
                                <div className="px-3 py-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Geral</p>
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                    <button
                                        onClick={() => {
                                            router.push(coreModule.href);
                                            setIsModuleSwitcherOpen(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group",
                                            currentModule === coreModule.id ? "bg-slate-50 border border-slate-100" : "hover:bg-slate-50 border border-transparent"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-lg transition-colors shadow-sm", coreModule.bg)}>
                                            <coreModule.icon size={18} className={coreModule.color} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-800">{coreModule.label}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Utilizadores, papéis e subscrição</p>
                                        </div>
                                        {currentModule === coreModule.id && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        )}
                                    </button>

                                    {user?.role === 'SUPER_ADMIN' && (
                                        <button
                                            onClick={() => {
                                                router.push('/admin');
                                                setIsModuleSwitcherOpen(false);
                                            }}
                                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all text-left"
                                        >
                                            <div className="p-2 bg-slate-900 rounded-lg shadow-sm">
                                                <ShieldCheck size={18} className="text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-800">Painel Admin</p>
                                                <p className="text-[10px] text-slate-400 font-medium">Gestão global da plataforma</p>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                )}

                {user?.organization?.name && (
                    <>
                        <div className="h-4 w-px bg-slate-200 mx-2 hidden lg:block" />
                        <div className="hidden lg:flex flex-col leading-tight min-w-0">
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{user.organization.name}</span>
                            {user.organization.nif && (
                                <span className="text-[10px] text-slate-400 font-medium">NIF: {user.organization.nif}</span>
                            )}
                        </div>
                    </>
                )}

                <div className="h-4 w-px bg-slate-200 mx-2 hidden md:block" />
                <Breadcrumb />
            </div>

            {/* Right: actions + user */}
            <div className="flex items-center gap-1 shrink-0">
                {/* Date & time */}
                <HeaderClock />

                {/* Modo Noturno */}
                <button
                    onClick={toggleTheme}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10"
                    aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo noturno'}
                    title={theme === 'dark' ? 'Modo claro' : 'Modo noturno'}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notifications */}
                <NotificationBell />

                {/* Settings shortcut */}
                {settingsHref && (
                    <button
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                        aria-label="Configurações"
                        onClick={() => router.push(settingsHref)}
                    >
                        <Settings size={18} />
                    </button>
                )}

                <div className="h-5 w-px bg-slate-200 mx-1.5" />

                {/* User dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        className="flex items-center gap-2 py-1.5 px-2 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-warm text-white font-black text-xs flex items-center justify-center shadow-md shadow-primary/20 uppercase shrink-0 select-none ring-2 ring-white">
                            {userInitial ?? <User size={15} />}
                        </div>

                        <div className="text-left hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 leading-tight tracking-tight">
                                {user?.name ?? 'Utilizador'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{userRole}</p>
                        </div>

                        <ChevronDown
                            size={13}
                            className={cn(
                                'text-slate-400 transition-transform duration-200 hidden sm:block',
                                isDropdownOpen && 'rotate-180'
                            )}
                        />
                    </button>

                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />

                            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Conta Ativa</p>
                                    <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                                </div>

                                <div className="p-1">
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            router.push('/core/profile');
                                        }}
                                        className="w-full px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors font-bold"
                                    >
                                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                                            <User size={14} />
                                        </div>
                                        Perfil do Utilizador
                                    </button>

                                    {settingsHref && (
                                        <button
                                            className="w-full px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors font-bold"
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                router.push(settingsHref);
                                            }}
                                        >
                                            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                                                <Settings size={14} />
                                            </div>
                                            Definições do Módulo
                                        </button>
                                    )}

                                    <div className="h-px bg-slate-100 my-1.5 mx-2" />

                                    <button
                                        onClick={() =>
                                            logout(undefined, { onSuccess: () => router.push('/signin') })
                                        }
                                        className="w-full px-3 py-2.5 text-left text-xs text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-3 transition-all font-black uppercase tracking-widest"
                                    >
                                        <div className="p-1.5 bg-rose-100 rounded-lg text-rose-500">
                                            <LogOut size={14} />
                                        </div>
                                        Sair do Sistema
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}