import { prisma } from '../../src/config/prisma.config.js';

export async function seedPlans() {
  console.log('💳 Creating plans...');
  
  const plans = [
    {
      code: 'starter',
      name: 'Starter',
      price: 15000,
      description: 'Ideal para pequenas empresas.',
      modules: ['faturacao'],
    },
    {
      code: 'professional',
      name: 'Professional',
      price: 45000,
      description: 'Para empresas em crescimento.',
      modules: ['faturacao', 'tesouraria'],
    },
    {
      code: 'enterprise',
      name: 'Enterprise',
      price: 95000,
      description: 'Solução completa para grandes operações.',
      modules: ['faturacao', 'tesouraria', 'stock', 'contabilidade'],
    },
  ];

  for (const planData of plans) {
    const { modules, ...data } = planData;
    const plan = await prisma.plan.upsert({
      where: { code: data.code },
      update: {},
      create: data,
    });

    // Link modules to plan
    for (const modCode of modules) {
      const mod = await prisma.module.findUnique({ where: { code: modCode } });
      if (mod) {
        await prisma.planModule.upsert({
          where: {
            planId_moduleId: {
              planId: plan.id,
              moduleId: mod.id,
            },
          },
          update: {},
          create: {
            planId: plan.id,
            moduleId: mod.id,
          },
        });
      }
    }
  }
}
