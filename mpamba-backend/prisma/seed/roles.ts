import { prisma } from '../../src/config/prisma.config.js';

export async function upsertRole(params: {
    name: string;
    description: string;
    organizationId: string;
    moduleId?: string;
    permissionCodes: string[];
}) {
    const { name, description, organizationId, moduleId, permissionCodes } = params;

    const allPermissions = await prisma.permission.findMany({
        where: { code: { in: permissionCodes } }
    });

    const role = await prisma.role.upsert({
        where: { 
            // In a real app we might want a unique constraint on [name, organizationId]
            // For now we assume names are unique per org or use a placeholder
            id: `${organizationId}-${name.replace(/\s+/g, '-').toLowerCase()}` 
        },
        update: {
            name,
            description,
            moduleId,
            permissions: {
                deleteMany: {},
                createMany: {
                    data: allPermissions.map(p => ({ permissionId: p.id }))
                }
            }
        },
        create: {
            id: `${organizationId}-${name.replace(/\s+/g, '-').toLowerCase()}`,
            name,
            description,
            organizationId,
            moduleId,
            permissions: {
                createMany: {
                    data: allPermissions.map(p => ({ permissionId: p.id }))
                }
            }
        }
    });

    return role;
}
