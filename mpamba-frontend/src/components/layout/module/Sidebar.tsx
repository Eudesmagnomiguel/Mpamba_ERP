'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useLogout } from '@/hooks/core/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { useLayoutConfig } from './LayoutContext';
import { ChevronDown, LogOut, User, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';

/* ─── Public types ────────────────────────────────────────────── */

export interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    permission?: string | null;
    children?: NavItem[];
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

/* ─── Sub-item ────────────────────────────────────────────────── */

function SubItem({
    item,
    active,
    onClose,
    flyout,
}: {
    item: NavItem;
    active: boolean;
    onClose?: () => void;
    flyout?: boolean;
}) {
    const router = useRouter();

    return (
        <button
            onClick={() => {
                router.push(item.href);
                if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose?.();
            }}
            className={cn(
                'w-full flex items-center gap-2.5 pr-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative',
                flyout ? 'pl-4' : 'pl-10',
                active
                    ? 'text-primary font-bold bg-white/90 shadow-sm shadow-black/10'
                    : 'text-white/70 hover:text-white/90 font-medium hover:bg-white/10 hover:shadow-sm'
            )}
        >
            <item.icon
                size={15}
                className={cn(
                    'shrink-0 transition-all duration-200',
                    active ? 'text-primary scale-110' : 'text-white/50 group-hover:text-white/70'
                )}
            />
            <span className="truncate flex-1">{item.name}</span>
            {active && (
                <span className="ml-auto w-2 h-2 rounded-full bg-primary shrink-0" />
            )}
        </button>
    );
}

/* ─── Nav item ────────────────────────────────────────────────── */

function NavItemButton({
    item,
    active,
    isChildActive,
    onClose,
    isCollapsed,
}: {
    item: NavItem;
    active: boolean;
    isChildActive: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(isChildActive);
    const hasChildren = !!item.children?.length;
    const showFlyout = isCollapsed && hasChildren && open;

    const handleClick = () => {
        if (hasChildren) {
            setOpen((v) => !v);
        } else {
            router.push(item.href);
            if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose?.();
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                    'w-full flex items-center rounded-lg text-sm transition-all duration-200 group relative overflow-hidden',
                    isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                    active && !hasChildren
                        ? 'bg-gradient-to-r from-white to-white/90 text-primary shadow-sm shadow-black/15 font-bold'
                        : isChildActive
                            ? 'bg-white/20 text-white font-semibold backdrop-blur-md border border-white/30 hover:bg-white/25 hover:shadow-sm'
                            : 'text-white/70 hover:bg-white/10 hover:text-white/90 font-medium transition-colors'
                )}
            >
                {/* Enhanced shimmer effect */}
                {active && !hasChildren && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 pointer-events-none" />
                )}

                <span
                    className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all relative z-10 font-bold text-lg',
                        active && !hasChildren
                            ? 'bg-primary text-white scale-110'
                            : isChildActive
                                ? 'bg-white/40 text-white'
                                : 'bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white/80'
                    )}
                >
                    <item.icon size={17} />
                    {isCollapsed && hasChildren && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-warm border border-primary" />
                    )}
                </span>

                {!isCollapsed && (
                    <>
                        <span className="flex-1 truncate text-left relative z-10 font-medium">{item.name}</span>

                        {hasChildren && (
                            <ChevronDown
                                size={16}
                                className={cn(
                                    'shrink-0 transition-all duration-300 relative z-10',
                                    active && !hasChildren
                                        ? 'text-primary'
                                        : isChildActive
                                            ? 'text-white'
                                            : 'text-white/40 group-hover:text-white/70',
                                    open && 'rotate-180'
                                )}
                            />
                        )}
                    </>
                )}
            </button>

            {hasChildren && open && !isCollapsed && (
                <div className="mt-1 mb-1 ml-1.5 pl-3 border-l-2 border-white/20 space-y-0.5">
                    {item.children!.map((child) => (
                        <SubItem
                            key={child.href}
                            item={child}
                            active={
                                pathname === child.href || pathname.startsWith(child.href + '/')
                            }
                            onClose={onClose}
                        />
                    ))}
                </div>
            )}

            {showFlyout && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute left-full top-0 ml-2 w-56 rounded-lg gradient-sidebar border border-white/10 shadow-2xl shadow-black/40 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <p className="px-4 pb-1.5 text-[10px] font-bold text-white/40 select-none truncate">{item.name}</p>
                        {item.children!.map((child) => (
                            <SubItem
                                key={child.href}
                                item={child}
                                active={
                                    pathname === child.href || pathname.startsWith(child.href + '/')
                                }
                                onClose={() => { onClose?.(); setOpen(false); }}
                                flyout
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

/* ─── Sidebar props ──────────────────────────────────────── */

export interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
}

/* ─── Sidebar ────────────────────────────────────────────── */

export default function Sidebar({ isOpen, onClose, isCollapsed }: SidebarProps) {
    const { groups, logo, rootHref } = useLayoutConfig();
    const pathname = usePathname();
    const router = useRouter();
    const { mutate: logout } = useLogout();
    const { user } = useAuthStore();

    const hasPermission = (code?: string | null) => {
        if (!code) return true;
        if (user?.role === 'SUPER_ADMIN') return true;
        return user?.permissions?.includes(code) ?? false;
    };

    const isActive = (href: string) => {
        if (href === rootHref) return pathname === rootHref;
        return pathname === href || pathname.startsWith(href + '/');
    };

    const isChildActive = (item: NavItem) =>
        item.children?.some((c) => isActive(c.href)) ?? false;

    const filterItems = (items: NavItem[]) =>
        items.filter((item) => {
            if (item.children?.length) {
                return item.children.some((c) => hasPermission(c.permission ?? null));
            }
            return hasPermission(item.permission ?? null);
        });

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 gradient-sidebar flex flex-col border-r border-primary/50 overflow-hidden',
                    'transition-all duration-300 ease-in-out',
                    'lg:static lg:translate-x-0 shrink-0 lg:w-64',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                    isCollapsed && 'lg:w-[76px]'
                )}
            >
                {/* Decorative glow */}
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-accent-warm/10 blur-3xl pointer-events-none" />

                {/* Logo */}
                <div className={cn('h-16 w-full flex items-center shrink-0 border-b border-white/10', isCollapsed ? 'justify-center px-2' : 'justify-between px-4')}>
                    {isCollapsed ? (
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white font-black text-base shrink-0" title="Mpamba">
                            M
                        </div>
                    ) : (
                        <div className="relative w-36 h-36 mx-auto shrink-0">
                            <Image src={logo} alt="Logo" fill className="object-contain object-left" />
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className={cn('flex-1 overflow-y-auto py-4 space-y-5 w-full', isCollapsed ? 'px-2' : 'px-3', styles.scrollbar)}>
                    {groups.map((group, idx) => {
                        const visibleItems = filterItems(group.items);
                        if (!visibleItems.length) return null;

                        return (
                            <div key={group.label}>
                                {isCollapsed ? (
                                    idx > 0 && <div className="border-t border-white/10 mx-1 mb-3" />
                                ) : (
                                    <p className="px-3 mb-3 text-[10px] font-bold text-white/40 select-none uppercase tracking-[0.15em]">
                                        {group.label}
                                    </p>
                                )}
                                <div className="space-y-0.5">
                                    {visibleItems.map((item) => (
                                        <NavItemButton
                                            key={item.href}
                                            item={item}
                                            active={isActive(item.href)}
                                            isChildActive={isChildActive(item)}
                                            onClose={onClose}
                                            isCollapsed={isCollapsed}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className={cn('border-t border-white/10 shrink-0 space-y-2 w-full', isCollapsed ? 'p-2' : 'p-3')}>
                    {/* User identity */}
                    {user && (
                        <div
                            title={isCollapsed ? user.name : undefined}
                            className={cn(
                                'flex items-center rounded-lg bg-white/5',
                                isCollapsed ? 'justify-center py-2' : 'gap-2.5 px-2.5 py-2'
                            )}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-warm text-white font-black text-xs flex items-center justify-center shadow-md shadow-black/20 uppercase shrink-0 select-none ring-2 ring-white/10">
                                {user.name?.charAt(0) ?? <User size={14} />}
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0 leading-tight">
                                    <p className="text-xs font-bold text-white/90 truncate">{user.name}</p>
                                    <p className="text-[10px] font-medium text-white/40 truncate">{user.email}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Logout */}
                    <button
                        onClick={() =>
                            logout(undefined, { onSuccess: () => router.push('/signin') })
                        }
                        title={isCollapsed ? 'Sair' : undefined}
                        className={cn(
                            'w-full cursor-pointer flex items-center rounded-lg text-sm font-bold text-white bg-white/10 hover:bg-rose-500/30 hover:text-rose-100 border border-transparent hover:border-rose-500/50 transition-all duration-200',
                            isCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-4 py-2'
                        )}
                    >
                        <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-rose-500/20 shrink-0 group-hover:bg-rose-500/30 transition-colors">
                            <LogOut size={16} />
                        </span>
                        {!isCollapsed && 'Sair'}
                    </button>
                </div>
            </aside>
        </>
    );
}