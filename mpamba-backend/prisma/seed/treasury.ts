import { prisma } from '../../src/config/prisma.config.js';

export async function seedTreasury(organizationId: string) {
  console.log(`💰 Creating default treasury categories for org ${organizationId}...`);
  
  const defaultCategories = [
    { name: 'Vendas', type: 'ENTRADA' },
    { name: 'Serviços', type: 'ENTRADA' },
    { name: 'Salários', type: 'SAIDA' },
    { name: 'Fornecedores', type: 'SAIDA' },
    { name: 'Operacional', type: 'SAIDA' },
  ];

  for (const cat of defaultCategories) {
    await prisma.financialCategory.upsert({
      where: {
        name_organizationId_type: {
          name: cat.name,
          organizationId: organizationId,
          type: cat.type as any
        }
      },
      update: {},
      create: {
        name: cat.name,
        type: cat.type as any,
        organizationId: organizationId
      }
    });
  }
}
