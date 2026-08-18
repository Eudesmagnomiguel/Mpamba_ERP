'use client';

import { createContext, useContext } from 'react';
import { StaticImageData } from 'next/image';
import { NavGroup } from './Sidebar';

/* ─── Shape ───────────────────────────────────────────────────── */

export interface LayoutConfig {
    /** Navigation groups passed to the sidebar */
    groups: NavGroup[];
    /** Logo image */
    logo: StaticImageData | string;
    /** Root href of the module (e.g. '/billing') */
    rootHref: string;
    /** Path for the settings shortcut in the header (e.g. '/billing/settings') */
    settingsHref?: string;
    /** Route segment → human label map used to build the breadcrumb */
    routeLabels?: Record<string, string>;
}

/* ─── Context ─────────────────────────────────────────────────── */

export const LayoutContext = createContext<LayoutConfig | null>(null);

export function useLayoutConfig(): LayoutConfig {
    const ctx = useContext(LayoutContext);
    if (!ctx) throw new Error('useLayoutConfig must be used inside <AppContainer>');
    return ctx;
}