import { prisma } from '../../src/config/prisma.config.js';

export async function seedStock(organizationId: string, adminUserId: string) {
    console.log(`📦 Creating stock data for organization ${organizationId}...`);

    // 1. Criar Categorias
    const categories = [
        { name: 'Alimentação', description: 'Produtos alimentares e bebidas' },
        { name: 'Limpeza', description: 'Produtos de higiene e limpeza' },
        { name: 'Escritório', description: 'Materiais de escritório' },
    ];

    const categoryMap: Record<string, string> = {};
    for (const cat of categories) {
        const created = await prisma.productCategory.upsert({
            where: { name_organizationId: { name: cat.name, organizationId: organizationId } },
            update: {},
            create: { ...cat, organizationId: organizationId }
        });
        categoryMap[cat.name] = created.id;
    }

    // 2. Criar Fornecedores
    const suppliers = [
        { name: 'Distribuidora Aliança', nif: '540112233', email: 'vendas@alianca.ao' },
        { name: 'AngoLimpa Lda', nif: '540998877', email: 'geral@angolimpa.ao' },
    ];

    const supplierMap: Record<string, string> = {};
    for (const sup of suppliers) {
        const created = await prisma.supplier.upsert({
            where: { nif_organizationId: { nif: sup.nif, organizationId: organizationId } },
            update: {},
            create: { ...sup, organizationId: organizationId }
        });
        supplierMap[sup.name] = created.id;
    }

    // 3. Criar Produtos Iniciais
    const products = [
        { name: 'Arroz Agulha 1kg', sku: 'ALIM-001', unit: 'UN', price: 1200, minStock: 50, category: 'Alimentação' },
        { name: 'Feijão Catarino 1kg', sku: 'ALIM-002', unit: 'UN', price: 950, minStock: 30, category: 'Alimentação' },
        { name: 'Óleo de Cozinha 1L', sku: 'ALIM-003', unit: 'L', price: 1500, minStock: 20, category: 'Alimentação' },
        { name: 'Detergente Líquido 500ml', sku: 'LIMP-001', unit: 'UN', price: 650, minStock: 15, category: 'Limpeza' },
    ];

    for (const pData of products) {
        const { category, ...p } = pData;
        const product = await prisma.product.upsert({
            where: {
                sku_organizationId: {
                    sku: p.sku,
                    organizationId: organizationId
                }
            },
            update: {
                ...p,
                categoryId: categoryMap[category]
            },
            create: {
                ...p,
                organizationId: organizationId,
                categoryId: categoryMap[category],
                currentQuantity: 0,
            }
        });

        // Criar movimento inicial de ENTRADA
        await prisma.stockMovement.create({
            data: {
                productId: product.id,
                organizationId: organizationId,
                userId: adminUserId,
                supplierId: supplierMap['Distribuidora Aliança'],
                type: 'ENTRADA',
                quantity: 100,
                reference: 'ENT-INICIAL-2024',
                reason: 'Abertura de Stock',
            }
        });

        await prisma.product.update({
            where: { id: product.id },
            data: { currentQuantity: 100 }
        });
    }

    console.log('✅ Stock data created successfully!');
}
