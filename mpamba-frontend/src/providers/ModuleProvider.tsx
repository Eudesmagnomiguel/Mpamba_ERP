'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { LayoutConfig } from '@/components/layout/module/LayoutContext';
import { billingConfig, stockConfig, treasuryConfig, adminConfig, accountingConfig } from '@/components/layout/module';

type ModuleName = 'billing' | 'stock' | 'treasury' | 'admin' | 'accounting';

interface ModuleContextType {
  currentModule: ModuleName;
  setCurrentModule: (module: ModuleName) => void;
  getConfig: (module: ModuleName) => LayoutConfig;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

const configMap: Record<ModuleName, LayoutConfig> = {
  billing: billingConfig,
  stock: stockConfig,
  treasury: treasuryConfig,
  admin: adminConfig,
  accounting: accountingConfig,
};

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [currentModule, setCurrentModule] = useState<ModuleName>('billing');

  const getConfig = (module: ModuleName) => configMap[module];

  return (
    <ModuleContext.Provider value={{ currentModule, setCurrentModule, getConfig }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModule must be used within ModuleProvider');
  }
  return context;
}
