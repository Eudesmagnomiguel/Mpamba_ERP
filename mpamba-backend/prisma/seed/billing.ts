import { prisma } from '../../src/config/prisma.config.js';

export async function seedBillingSeries(organizationId: string) {
    console.log(`🧾 Creating billing series for organization ${organizationId}...`);

    const currentYear = new Date().getFullYear();
    const prefixes = ['FT', 'PF', 'RC', 'NC'];

    for (const prefix of prefixes) {
        await prisma.invoiceSeries.upsert({
            where: {
                prefix_year_organizationId: {
                    prefix,
                    year: currentYear,
                    organizationId
                }
            },
            update: {
                isActive: true
            },
            create: {
                prefix,
                year: currentYear,
                organizationId,
                nextSequence: 1,
                isActive: true
            }
        });
    }

    console.log('✅ Billing series created successfully!');
}
