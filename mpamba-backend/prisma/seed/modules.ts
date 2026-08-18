import { prisma } from '../../src/config/prisma.config.js';

export async function seedModules() {
  console.log('📦 Creating modules...');
  
  const modules = [
    {
      code: 'faturacao',
      name: 'Faturação',
      description: 'Gestão de faturas, recibos e documentos comerciais.',
    },
    {
      code: 'stock',
      name: 'Stock',
      description: 'Gestão de inventário, produtos e movimentos.',
    },
    {
      code: 'tesouraria',
      name: 'Tesouraria',
      description: 'Gestão de fluxos de caixa, bancos e movimentos financeiros.',
    },
    {
      code: 'contabilidade',
      name: 'Contabilidade',
      description: 'Plano de contas, lançamentos automáticos e balancete (dupla entrada).',
    },
  ];

  const results: any = {};

  for (const m of modules) {
    results[m.code] = await prisma.module.upsert({
      where: { code: m.code },
      update: { name: m.name, description: m.description },
      create: m,
    });
  }

  return results;
}
