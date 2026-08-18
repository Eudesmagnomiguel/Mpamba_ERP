import bcrypt from 'bcryptjs';
import { prisma } from '../../src/config/prisma.config.js';
import { upsertRole } from './roles.js';
import { RoleTemplateService } from '../../src/services/core/role-template.service.js';

export async function seedUsersAndOrgs() {
  console.log('🏢 Creating organizations, roles and users...');

  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // 1. System Organization
  const systemOrg = await prisma.organization.upsert({
    where: { nif: '000000000' },
    update: {},
    create: { name: 'Mpamba System', nif: '000000000', isActive: true },
  });

  // 2. Super Admin
  const allPermissions = await prisma.permission.findMany();
  const superAdminRole = await upsertRole({
    name: 'Super Administrador',
    description: 'Acesso total ao sistema',
    organizationId: systemOrg.id,
    permissionCodes: allPermissions.map(p => p.code),
  });

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'admin@mpamba.com' },
    update: { organizationId: null },
    create: {
      name: 'Emanuel Gaspar',
      email: 'admin@mpamba.com',
      passwordHash: defaultPasswordHash,
      isActive: true,
      organizationId: null,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: superAdminUser.id, roleId: superAdminRole.id },
  });

  // 3. Test Billing Organization
  const billingOrg = await prisma.organization.upsert({
    where: { nif: '123456789' },
    update: {},
    create: {
      name: 'Emanuel Malungo (Billing)',
      nif: '123456789',
      email: 'emanuekmalungo856@gmail.com',
      isActive: true,
    },
  });

  // 4. Test Stock Organization
  const stockOrg = await prisma.organization.upsert({
    where: { nif: 'STK-9988-77' },
    update: {},
    create: {
      name: 'Stock Master, Lda',
      nif: 'STK-9988-77',
      email: 'contato@stockmaster.ao',
      isActive: true,
    },
  });

  // 5. Test Treasury Organization
  const treasuryOrg = await prisma.organization.upsert({
    where: { nif: 'TRS-1122-33' },
    update: {},
    create: {
      name: 'Treasury Management, Lda',
      nif: 'TRS-1122-33',
      email: 'tesouraria@treasurymgt.ao',
      isActive: true,
    },
  });

  // Helper for Org Admins
  const createOrgAdmin = async (params: { 
    org: any, 
    email: string, 
    name: string, 
    permissions: string[] 
  }) => {
    const role = await upsertRole({
      name: 'Administrador',
      description: 'Acesso total à organização',
      organizationId: params.org.id,
      permissionCodes: params.permissions,
    });

    const user = await prisma.user.upsert({
      where: { email: params.email },
      update: { organizationId: params.org.id, name: params.name },
      create: {
        name: params.name,
        email: params.email,
        passwordHash: defaultPasswordHash,
        isActive: true,
        organizationId: params.org.id,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });

    return user;
  };

  // Create Admins
  const billingAdmin = await createOrgAdmin({
    org: billingOrg,
    email: 'emanuelmalungo856@gmail.com',
    name: 'Emanuel Malungo',
    permissions: [
        'user:create', 'user:view', 'user:update', 'user:delete',
        'role:view', 'role:create', 'role:update',
        'permission:view',
        'module:view',
        'org:view',
        'setting:view', 'setting:update',
        'invoice:create', 'invoice:view', 'invoice:update', 'invoice:issue', 'invoice:cancel', 'invoice:send',
        'customer:create', 'customer:view', 'customer:update', 'customer:delete',
        'billing:receipt:create', 'billing:receipt:view',
        'billing:proforma:create', 'billing:proforma:view',
        'billing:credit_note:create', 'billing:credit_note:view',
        'billing:tax:manage', 'billing:series:manage', 'billing:report:view',
        'billing:pos:manage',
        'stock:product:view', 'stock:product:create', 'stock:product:update',
        'stock:movement:view', 'stock:entry:view', 'stock:exit:view'
    ]
  });

  const stockAdmin = await createOrgAdmin({
    org: stockOrg,
    email: 'carlos.admin@stockmaster.ao',
    name: 'Carlos Neto',
    permissions: [
        'user:create', 'user:view', 'user:update', 'user:delete',
        'role:view', 'role:create', 'role:update',
        'permission:view',
        'module:view',
        'org:view',
        'setting:view', 'setting:update',
        'stock:product:create', 'stock:product:view', 'stock:product:update', 'stock:product:delete',
        'stock:movement:create', 'stock:movement:view', 'stock:adjustment:create',
        'stock:entry:create', 'stock:entry:view', 'stock:exit:create', 'stock:exit:view', 'stock:report:view',
        'stock:category:create', 'stock:category:view', 'stock:category:update', 'stock:category:delete',
        'stock:supplier:create', 'stock:supplier:view', 'stock:supplier:update', 'stock:supplier:delete',
    ]
  });

  const treasuryAdmin = await createOrgAdmin({
    org: treasuryOrg,
    email: 'admin.tesouraria@treasurymgt.ao',
    name: 'Administrador',
    permissions: [
        'user:create', 'user:view', 'user:update', 'user:delete',
        'role:view', 'role:create', 'role:update',
        'permission:view',
        'module:view',
        'org:view',
        'setting:view', 'setting:update',
        'treasury:account:create', 'treasury:account:view',
        'treasury:category:create', 'treasury:category:view', 'treasury:category:update', 'treasury:category:delete',
        'treasury:transaction:create', 'treasury:transaction:view', 'treasury:transaction:update', 'treasury:transaction:delete',
        'treasury:transfer:create',
        'treasury:report:view',
    ]
  });

  // Perfis pré-configurados (Diretor Geral, Tesoureiro, Facturista, etc.) para as orgs de teste
  await RoleTemplateService.createRoleTemplatesForOrganization(billingOrg.id);
  await RoleTemplateService.createRoleTemplatesForOrganization(stockOrg.id);
  await RoleTemplateService.createRoleTemplatesForOrganization(treasuryOrg.id);

  return { billingOrg, stockOrg, treasuryOrg, superAdminUser, billingAdmin, stockAdmin, treasuryAdmin };
}
