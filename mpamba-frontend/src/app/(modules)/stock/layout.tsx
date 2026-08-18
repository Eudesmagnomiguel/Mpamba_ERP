'use client';
import { ModuleLayout } from '@/components/layout/module/ModuleLayout';

export default function StockLayout({ children }: { children: React.ReactNode }) {
    return <ModuleLayout module="stock">{children}</ModuleLayout>;
}