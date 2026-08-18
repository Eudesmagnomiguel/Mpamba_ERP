'use client';

import { useEffect } from 'react';
import { useModule } from '@/providers/ModuleProvider';
import AppContainer from '@/components/layout/module/Container';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

type ModuleName = 'billing' | 'stock' | 'treasury' | 'admin' | 'accounting';

interface ModuleLayoutProps {
  module: ModuleName;
  children: React.ReactNode;
}

export function ModuleLayout({ module, children }: ModuleLayoutProps) {
  const { setCurrentModule, getConfig } = useModule();
  const config = getConfig(module);

  useEffect(() => {
    setCurrentModule(module);
  }, [module, setCurrentModule]);

  return (
    <ProtectedRoute>
      <AppContainer {...config}>{children}</AppContainer>
    </ProtectedRoute>
  );
}
