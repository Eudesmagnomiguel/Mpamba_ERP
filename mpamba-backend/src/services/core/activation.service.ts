import { prisma } from '../../config/prisma.config.js';

/**
 * ActivationService (Super Admin Operations)
 * Responsável por gerar códigos que desbloqueiam planos e organizações.
 */
export class ActivationService {
	/**
	 * Gera um código de ativação para uma organização.
	 * O código será vinculado ao plano da organização.
	 */
	static async generateCode(organizationId: string) {
		const organization = await prisma.organization.findUnique({
			where: { id: organizationId },
			include: { plan: true }
		});

		if (!organization) {
			throw new Error('Organização não encontrada');
		}

		if (!organization.planId) {
			throw new Error('Organização não tem um plano associado');
		}

		// Gera código de 8 caracteres alfanuméricos
		const code = Math.random().toString(36).substring(2, 10).toUpperCase();

		const expiresAt = new Date();
		expiresAt.setMonth(expiresAt.getMonth() + 1); // Expira em 30 dias para resgate

		// Limpar códigos anteriores não utilizados para evitar erros de restrição única
		// e manter o banco de dados organizado
		await prisma.activationCode.deleteMany({
			where: { 
				organizationId,
				isUsed: false
			}
		});

		return prisma.activationCode.create({
			data: {
				code,
				planId: organization.planId,
				organizationId,
				expiresAt,
				isUsed: false
			},
			include: { plan: true }
		});
	}

	/**
	 * Ativa uma organização inteira (primeira ativação)
	 * Este método agora delega a lógica pesada de subscrição ao SubscriptionService
	 */
	static async activateOrganization(code: string, organizationId: string) {
		const activationRecord = await prisma.activationCode.findFirst({
			where: {
				code,
				isUsed: false,
				expiresAt: { gt: new Date() }
			}
		});

		if (!activationRecord) {
			throw new Error('Código de ativação inválido ou expirado');
		}

		// 1. Ativar a organização
		await prisma.organization.update({
			where: { id: organizationId },
			data: { isActive: true }
		});

		// 2. Usar o código para configurar a subscrição e módulos
		const { SubscriptionService } = await import('./subscription.service.js');
		return SubscriptionService.useActivationCode(organizationId, code);
	}
}