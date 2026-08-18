'use client';

import { CoreLayoutWrapper } from '@/components/layout/module/CoreLayoutWrapper';

export default function CoreLayout({ children }: { children: React.ReactNode }) {
    return <CoreLayoutWrapper>{children}</CoreLayoutWrapper>;
}
