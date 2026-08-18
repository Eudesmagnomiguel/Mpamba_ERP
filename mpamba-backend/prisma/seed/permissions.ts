import { prisma } from '../../src/config/prisma.config.js';

// ===== LISTA CENTRALIZADA DE TODAS AS PERMISSÕES =====
export const PERMISSIONS_LIST = [
  // Users
  { code: 'user:create', description: 'Criar utilizadores' },
  { code: 'user:view', description: 'Visualizar utilizadores' },
  { code: 'user:update', description: 'Atualizar utilizadores' },
  { code: 'user:delete', description: 'Eliminar utilizadores' },

  // Plans
  { code: 'plan:create', description: 'Criar planos' },
  { code: 'plan:view', description: 'Visualizar planos' },
  { code: 'plan:update', description: 'Atualizar planos' },
  { code: 'plan:delete', description: 'Eliminar planos' },

  // Organizations
  { code: 'org:create', description: 'Criar organizações' },
  { code: 'org:view', description: 'Visualizar organizações' },
  { code: 'org:update', description: 'Atualizar organizações' },
  { code: 'org:delete', description: 'Eliminar organizações' },

  // Modules
  { code: 'module:create', description: 'Criar módulos' },
  { code: 'module:view', description: 'Visualizar módulos' },
  { code: 'module:update', description: 'Atualizar módulos' },
  { code: 'module:delete', description: 'Eliminar módulos' },

  // Roles
  { code: 'role:create', description: 'Criar papéis' },
  { code: 'role:view', description: 'Visualizar papéis' },
  { code: 'role:update', description: 'Atualizar papéis' },
  { code: 'role:delete', description: 'Eliminar papéis' },

  // Role Permissions
  { code: 'role_permission:update', description: 'Atualizar permissões de um papel' },
  { code: 'role_permission:view', description: 'Visualizar permissões de um papel' },

  // Permission Management
  { code: 'permission:create', description: 'Criar permissões' },
  { code: 'permission:view', description: 'Visualizar permissões' },
  { code: 'permission:update', description: 'Atualizar permissões' },
  { code: 'permission:delete', description: 'Eliminar permissões' },

  // Settings & Logs
  { code: 'setting:view', description: 'Visualizar configurações' },
  { code: 'setting:update', description: 'Atualizar configurações' },
  { code: 'log:view', description: 'Visualizar logs do sistema' },

  // Contabilidade (em construção)
  { code: 'accounting:account:view', description: 'Visualizar plano de contas' },
  { code: 'accounting:account:create', description: 'Criar contas contabilísticas' },
  { code: 'accounting:account:update', description: 'Atualizar contas contabilísticas' },
  { code: 'accounting:entry:view', description: 'Visualizar lançamentos contabilísticos' },
  { code: 'accounting:entry:create', description: 'Criar lançamentos contabilísticos' },
  { code: 'accounting:report:view', description: 'Visualizar demonstrações financeiras' },

  // Dashboard
  { code: 'dashboard:view', description: 'Visualizar estatísticas globais do dashboard' },

  // Notifications
  { code: 'notification:send', description: 'Enviar notificações para utilizadores/organizações' },

  // Stock Management
  { code: 'stock:product:create', description: 'Criar produtos no stock' },
  { code: 'stock:product:view', description: 'Visualizar produtos no stock' },
  { code: 'stock:product:update', description: 'Atualizar produtos no stock' },
  { code: 'stock:product:delete', description: 'Eliminar produtos no stock' },
  { code: 'stock:movement:create', description: 'Realizar movimentos de stock' },
  { code: 'stock:movement:view', description: 'Visualizar movimentos de stock' },
  { code: 'stock:entry:create', description: 'Realizar entradas de stock' },
  { code: 'stock:entry:view', description: 'Visualizar entradas de stock' },
  { code: 'stock:exit:create', description: 'Realizar saídas de stock' },
  { code: 'stock:exit:view', description: 'Visualizar saídas de stock' },
  { code: 'stock:report:view', description: 'Visualizar relatórios de stock' },
  { code: 'stock:adjustment:create', description: 'Realizar ajustes de stock' },

  // Stock Categories
  { code: 'stock:category:create', description: 'Criar categorias de produtos' },
  { code: 'stock:category:view', description: 'Visualizar categorias de produtos' },
  { code: 'stock:category:update', description: 'Atualizar categorias de produtos' },
  { code: 'stock:category:delete', description: 'Eliminar categorias de produtos' },

  // Stock Suppliers
  { code: 'stock:supplier:create', description: 'Criar fornecedores' },
  { code: 'stock:supplier:view', description: 'Visualizar fornecedores' },
  { code: 'stock:supplier:update', description: 'Atualizar fornecedores' },
  { code: 'stock:supplier:delete', description: 'Eliminar fornecedores' },

  // Billing Management
  { code: 'invoice:create', description: 'Criar faturas' },
  { code: 'invoice:view', description: 'Visualizar faturas' },
  { code: 'invoice:update', description: 'Atualizar faturas' },
  { code: 'invoice:issue', description: 'Emitir faturas (tornar oficial)' },
  { code: 'invoice:cancel', description: 'Cancelar faturas emitidas' },
  { code: 'invoice:send', description: 'Enviar faturas por email' },

  // Additional Billing Features
  { code: 'billing:receipt:create', description: 'Criar recibos' },
  { code: 'billing:receipt:view', description: 'Visualizar recibos' },
  { code: 'billing:proforma:create', description: 'Criar faturas proforma' },
  { code: 'billing:proforma:view', description: 'Visualizar faturas proforma' },
  { code: 'billing:credit_note:create', description: 'Criar notas de crédito' },
  { code: 'billing:credit_note:view', description: 'Visualizar notas de crédito' },
  { code: 'billing:quote:create', description: 'Criar cotações/orçamentos' },
  { code: 'billing:quote:view', description: 'Visualizar cotações/orçamentos' },
  { code: 'billing:service:create', description: 'Criar serviços' },
  { code: 'billing:service:view', description: 'Visualizar serviços' },
  { code: 'billing:service:update', description: 'Atualizar serviços' },
  { code: 'billing:service:delete', description: 'Eliminar serviços' },
  { code: 'billing:tax:manage', description: 'Configurar impostos e taxas' },
  { code: 'billing:series:manage', description: 'Gerir séries de documentos' },
  { code: 'billing:report:view', description: 'Visualizar relatórios de faturação' },
  { code: 'billing:pos:manage', description: 'Gestão de pontos de venda (POS)' },
  { code: 'billing:discount:approve', description: 'Aprovar descontos em documentos' },
  { code: 'billing:setting:update', description: 'Atualizar configurações de faturação' },

  // Customers
  { code: 'customer:create', description: 'Criar clientes' },
  { code: 'customer:view', description: 'Visualizar clientes' },
  { code: 'customer:update', description: 'Atualizar clientes' },
  { code: 'customer:delete', description: 'Eliminar clientes' },

  // Treasury Management
  { code: 'treasury:account:create', description: 'Criar contas financeiras' },
  { code: 'treasury:account:view', description: 'Visualizar contas e saldos' },
  { code: 'treasury:account:update', description: 'Atualizar contas financeiras' },
  { code: 'treasury:account:delete', description: 'Eliminar contas financeiras' },
  { code: 'treasury:category:create', description: 'Criar categorias financeiras' },
  { code: 'treasury:category:view', description: 'Visualizar categorias financeiras' },
  { code: 'treasury:category:update', description: 'Atualizar categorias financeiras' },
  { code: 'treasury:category:delete', description: 'Eliminar categorias financeiras' },
  { code: 'treasury:transaction:create', description: 'Registrar entradas e saídas' },
  { code: 'treasury:transaction:view', description: 'Visualizar transações' },
  { code: 'treasury:transaction:update', description: 'Atualizar transações' },
  { code: 'treasury:transaction:delete', description: 'Eliminar transações' },
  { code: 'treasury:transfer:create', description: 'Realizar transferências' },
  { code: 'treasury:report:view', description: 'Visualizar relatórios financeiros' },
];

// ===== FUNÇÃO PARA CRIAR/SINCRONIZAR PERMISSÕES NO BANCO =====
export async function seedPermissions() {
  console.log('🔑 Creating permissions...');

  for (const p of PERMISSIONS_LIST) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  console.log('✅ Permissions created/synchronized successfully!');
}