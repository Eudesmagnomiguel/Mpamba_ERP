'use client';

import Header from './Header';
import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';
import { LayoutContext, LayoutConfig } from './LayoutContext';

const SIDEBAR_COLLAPSED_KEY = 'mpamba:sidebar-collapsed';

/* ─── Props ───────────────────────────────────────────────────── */

interface ContainerProps extends LayoutConfig {
    children: React.ReactNode;
}

/* ─── AppContainer ────────────────────────────────────────────── */

/**
 * Generic layout container. Wrap every module's layout with this component
 * and pass the module's nav config. Header and Sidebar consume the config
 * automatically via LayoutContext — no prop drilling.
 *
 * @example
 * // app/billing/layout.tsx
 * import Container from '@/components/layout/shared/Container';
 * import { billingConfig } from '@/components/layout/billing/billing.config';
 *
 * export default function BillingLayout({ children }) {
 *   return <Container {...billingConfig}>{children}</Container>;
 * }
 */
export default function Container({
    children,
    groups,
    logo,
    rootHref,
    settingsHref,
    routeLabels,
}: ContainerProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) : null;
        if (stored === '1') setIsCollapsed(true);
    }, []);

    const toggleCollapsed = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
            return next;
        });
    };

    return (
        <LayoutContext.Provider value={{ groups, logo, rootHref, settingsHref, routeLabels }}>
            <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
                {/* Sidebar reads groups/logo/rootHref from context */}
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    isCollapsed={isCollapsed}
                />

                {/* Main column */}
                <div className="flex flex-col flex-1 min-w-0 h-full">
                    {/* Header reads routeLabels/settingsHref from context */}
                    <Header
                        onToggleSidebar={() => setIsSidebarOpen(true)}
                        isSidebarCollapsed={isCollapsed}
                        onToggleSidebarCollapse={toggleCollapsed}
                    />

                    <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 bg-app-canvas">
                        <div className="max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8 h-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </LayoutContext.Provider>
    );
}