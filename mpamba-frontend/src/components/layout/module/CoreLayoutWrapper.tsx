'use client';

import { useModule } from '@/providers/ModuleProvider';
import Container from '@/components/layout/module/Container';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface CoreLayoutWrapperProps {
  children: React.ReactNode;
}

export function CoreLayoutWrapper({ children }: CoreLayoutWrapperProps) {
  const { currentModule, getConfig } = useModule();
  const config = getConfig(currentModule);

  return (
    <ProtectedRoute>
      <Container {...config}>{children}</Container>
    </ProtectedRoute>
  );
}
