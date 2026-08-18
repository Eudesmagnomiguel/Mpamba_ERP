import { prisma } from '../src/config/prisma.config.js';

async function checkPermissions() {
    const roles = await prisma.role.findMany({
        where: { organization: { nif: 'STK-9988-77' } },
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });

    for (const role of roles) {
        console.log(`Role: ${role.name}`);
        console.log(`Permissions: ${role.permissions.map(p => p.permission.code).join(', ') || 'NONE'}`);
        console.log('---');
    }
}

checkPermissions().finally(() => prisma.$disconnect());
