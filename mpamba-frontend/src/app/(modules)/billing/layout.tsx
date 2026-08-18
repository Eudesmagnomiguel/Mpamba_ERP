'use client';
import { ModuleLayout } from '@/components/layout/module/ModuleLayout';

export default function BillingLayout({ children }: { children: React.ReactNode }) {
    return <ModuleLayout module="billing">{children}</ModuleLayout>;
}