import { prisma } from '../src/config/prisma.config.js';
import { seedPermissions } from './seed/permissions.js';
import { seedModules } from './seed/modules.js';
import { seedPlans } from './seed/plans.js';
import { seedUsersAndOrgs } from './seed/users.js';
import { seedTreasury } from './seed/treasury.js';
import { seedStock } from './seed/stock.js';
import { seedBillingSeries } from './seed/billing.js';

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Core Data (Static)
  await seedPermissions();
  const modules = await seedModules();
  await seedPlans();

  // 2. Dynamic Data (Orgs, Users, Roles)
  const { billingOrg, stockOrg, treasuryOrg, billingAdmin, stockAdmin, treasuryAdmin } = await seedUsersAndOrgs();

  // 3. Subscriptions & Modules for Orgs
  const starterPlan = await prisma.plan.findUnique({ where: { code: 'starter' } });
  const proPlan = await prisma.plan.findUnique({ where: { code: 'professional' } });

  const setupOrg = async (org: any, plan: any, moduleCode: string) => {
    if (!org || !plan) return;
    
    // Link Plan
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    await prisma.subscription.upsert({
      where: { organizationId: org.id },
      update: { planId: plan.id, status: 'ACTIVE', endDate },
      create: { organizationId: org.id, planId: plan.id, status: 'ACTIVE', endDate },
    });

    // Link Module
    const mod = modules[moduleCode];
    if (mod) {
      await prisma.organizationModule.upsert({
        where: { organizationId_moduleId: { organizationId: org.id, moduleId: mod.id } },
        update: { isActive: true },
        create: { organizationId: org.id, moduleId: mod.id, isActive: true },
      });
    }
  };

  await setupOrg(billingOrg, starterPlan, 'faturacao');
  await setupOrg(stockOrg, proPlan, 'stock');
  await setupOrg(treasuryOrg, proPlan, 'tesouraria');

  // Ativa também o Stock para a org de Faturação, para permitir testar o Posto de Venda (POS)
  if (billingOrg && modules.stock) {
    await prisma.organizationModule.upsert({
      where: { organizationId_moduleId: { organizationId: billingOrg.id, moduleId: modules.stock.id } },
      update: { isActive: true },
      create: { organizationId: billingOrg.id, moduleId: modules.stock.id, isActive: true },
    });
  }

  // 4. Specific Module Data
  if (billingOrg) {
    await seedBillingSeries(billingOrg.id);
  }

  if (treasuryOrg) {
    await seedTreasury(treasuryOrg.id);
  }

  if (stockOrg && stockAdmin) {
    await seedStock(stockOrg.id, stockAdmin.id);
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
