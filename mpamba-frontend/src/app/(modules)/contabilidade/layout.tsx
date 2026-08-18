'use client';
import { ModuleLayout } from '@/components/layout/module/ModuleLayout';

export default function ContabilidadeLayout({ children }: { children: React.ReactNode }) {
    return <ModuleLayout module="accounting">{children}</ModuleLayout>;
}
