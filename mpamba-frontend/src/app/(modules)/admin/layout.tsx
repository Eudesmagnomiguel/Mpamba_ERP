'use client';

import { ModuleLayout } from '@/components/layout/module/ModuleLayout';

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
    return <ModuleLayout module="admin">{children}</ModuleLayout>;
}