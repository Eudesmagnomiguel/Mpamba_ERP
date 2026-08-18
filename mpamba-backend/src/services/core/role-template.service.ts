import { prisma } from '../../config/prisma.config.js';
import { ROLE_TEMPLATES } from '../../shared/utils/rbac/role-templates.constants.js';

export class RoleTemplateService {
	/**
	 * Cria (ou sincroniza) os perfis de utilizador pré-configurados para uma organização:
	 * Diretor Geral, Diretor Financeiro, Gestor, Tesoureiro, Facturista, Contabilista, Auditor, Operador.
	 * Idempotente — pode ser chamado várias vezes sem duplicar papéis.
	 */
	static async createRoleTemplatesForOrganization(organizationId: string) {
		for (const template of ROLE_TEMPLATES) {
			const permissions = await prisma.permission.findMany({
				where: { code: { in: template.permissionCodes } },
			});

			const roleId = `${organizationId}-${template.name.replace(/\s+/g, '-').toLowerCase()}`;

			await prisma.role.upsert({
				where: { id: roleId },
				update: {
					description: template.description,
					permissions: {
						deleteMany: {},
						createMany: { data: permissions.map((p) => ({ permissionId: p.id })) },
					},
				},
				create: {
					id: roleId,
					name: template.name,
					description: template.description,
					organizationId,
					permissions: {
						createMany: { data: permissions.map((p) => ({ permissionId: p.id })) },
					},
				},
			});
		}
	}
}
