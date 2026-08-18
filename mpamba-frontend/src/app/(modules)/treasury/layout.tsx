'use client';
import { ModuleLayout } from '@/components/layout/module/ModuleLayout';

export default function TreasuryLayout({ children }: { children: React.ReactNode }) {
    return <ModuleLayout module="treasury">{children}</ModuleLayout>;
}