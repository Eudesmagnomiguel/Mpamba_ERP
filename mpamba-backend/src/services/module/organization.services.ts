import { prisma } from "../../config/prisma.config.js";
import type { CreateOrganizationDto, UpdateOrganizationDto, UpdateOwnOrganizationDto } from "../../shared/dto/organization.dto.js";

/** Erro de negócio: já existe outra organização com o mesmo NIF. */
export class DuplicateNifError extends Error {
	constructor() {
		super("Já existe uma organização registada com este NIF.");
		this.name = "DuplicateNifError";
	}
}

/** Erro de negócio: o plano indicado no formulário não existe. */
export class PlanNotFoundError extends Error {
	constructor() {
		super("O plano indicado não existe.");
		this.name = "PlanNotFoundError";
	}
}

/** Duração, em meses, da subscrição criada ao atribuir um plano no backoffice. */
const SUBSCRIPTION_MONTHS = 12;

/** Cliente Prisma dentro de uma transação. */
type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Converte campos vazios do formulário em NULL, preservando `undefined`. */
function blankToNull(value?: string | null): string | null {
	const trimmed = typeof value === "string" ? value.trim() : value;
	return trimmed ? trimmed : null;
}

export class OrganizationService {
	async findAll(paginationOptions?: { page?: number; pageSize?: number }) {
		const page = paginationOptions?.page || 1;
		const pageSize = paginationOptions?.pageSize || 10;
		const skip = (page - 1) * pageSize;

		const [data, total] = await Promise.all([
			prisma.organization.findMany({
				include: {
					modules: {
						include: { module: true }
					},
					plan: true,
					subscription: { select: { status: true } },
					_count: { select: { users: true } }
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: pageSize
			}),
			prisma.organization.count()
		]);

		const totalPages = Math.ceil(total / pageSize);

		return {
			data,
			pagination: {
				page,
				pageSize,
				total,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1
			}
		};
	}

	async findById(id: string) {
		return prisma.organization.findUnique({
			where: { id },
			include: {
				// Só os módulos realmente ativos: as mudanças de plano e o
				// cancelamento desativam as linhas em vez de as apagar, e um
				// módulo desativado não pode aparecer no perfil como contratado.
				modules: {
					where: { isActive: true },
					include: { module: true }
				},
				// Sem `plan` e `subscription` o perfil da empresa não tinha como
				// mostrar o plano nem o estado da subscrição, mesmo quando ambos
				// estavam corretamente gravados.
				plan: {
					include: { modules: { include: { module: true } } }
				},
				subscription: {
					include: { plan: true }
				},
				users: {
					select: {
						id: true,
						name: true,
						email: true,
						isActive: true
					}
				}
			}
		});
	}

	/**
	 * Cria/atualiza a subscrição da organização e sincroniza os seus módulos
	 * com os do plano.
	 *
	 * `Organization.planId` e a tabela `Subscription` são coisas distintas:
	 * sem este passo, escolher um plano no backoffice gravava apenas o primeiro
	 * e não havia linha em `Subscription` nem em `OrganizationModule`. O
	 * resultado era a empresa ficar com plano na lista mas sem estado de
	 * subscrição, e com todos os módulos fechados pelos guards.
	 */
	private async provisionPlan(tx: PrismaTransaction, organizationId: string, planId: string) {
		const plan = await tx.plan.findUnique({
			where: { id: planId },
			include: { modules: true }
		});

		if (!plan) {
			throw new PlanNotFoundError();
		}

		const startDate = new Date();
		const endDate = new Date(startDate);
		endDate.setMonth(endDate.getMonth() + SUBSCRIPTION_MONTHS);

		await tx.subscription.upsert({
			where: { organizationId },
			update: { planId, status: 'ACTIVE', startDate, endDate },
			create: { organizationId, planId, status: 'ACTIVE', startDate, endDate }
		});

		// Desativa tudo antes de reativar: numa descida de plano, os módulos que
		// deixaram de estar incluídos têm mesmo de sair.
		await tx.organizationModule.updateMany({
			where: { organizationId },
			data: { isActive: false }
		});

		for (const planModule of plan.modules) {
			await tx.organizationModule.upsert({
				where: {
					organizationId_moduleId: { organizationId, moduleId: planModule.moduleId }
				},
				update: { isActive: true },
				create: { organizationId, moduleId: planModule.moduleId, isActive: true }
			});
		}
	}

	async create(data: CreateOrganizationDto) {
		// `nif` tem índice único: gravar '' em vez de NULL faz com que apenas a
		// primeira organização sem NIF seja aceite e todas as seguintes falhem
		// com violação de unicidade. Campos vazios ficam sempre a NULL.
		const nif = blankToNull(data.nif);

		if (nif) {
			const duplicate = await prisma.organization.findUnique({ where: { nif } });
			if (duplicate) {
				throw new DuplicateNifError();
			}
		}

		const planId = data.planId !== undefined && data.planId !== '' ? data.planId : null;

		return prisma.$transaction(async (tx) => {
			const organization = await tx.organization.create({
				data: {
					name: data.name.trim(),
					nif,
					address: blankToNull(data.address),
					phone: blankToNull(data.phone),
					email: blankToNull(data.email),
					...(planId && { planId }),
					...(data.isActive !== undefined && { isActive: data.isActive })
				}
			});

			if (planId) {
				await this.provisionPlan(tx, organization.id, planId);
			}

			return organization;
		});
	}

	async update(id: string, data: UpdateOrganizationDto & UpdateOwnOrganizationDto) {
		// Mesmo motivo do create: um NIF apagado no formulário chega como ''
		// e colidiria no índice único com outra organização sem NIF.
		const nif = data.nif !== undefined ? blankToNull(data.nif) : undefined;

		if (nif) {
			const duplicate = await prisma.organization.findUnique({ where: { nif } });
			if (duplicate && duplicate.id !== id) {
				throw new DuplicateNifError();
			}
		}

		const planId = data.planId !== undefined ? (data.planId === '' ? null : data.planId) : undefined;

		return prisma.$transaction(async (tx) => {
			// Estado anterior, para só reprovisionar quando o plano muda de facto.
			// Guardar o formulário sem lhe tocar não pode renovar a subscrição
			// nem reativar uma organização suspensa.
			const [previous, existingSubscription] = await Promise.all([
				tx.organization.findUnique({ where: { id }, select: { planId: true } }),
				tx.subscription.findUnique({ where: { organizationId: id }, select: { id: true } })
			]);

			const organization = await tx.organization.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.nif !== undefined && { nif }),
				...(data.address !== undefined && { address: data.address }),
				...(data.phone !== undefined && { phone: data.phone }),
				...(data.email !== undefined && { email: data.email === '' ? null : data.email }),
				...(data.planId !== undefined && { planId: data.planId === '' ? null : data.planId }),
				...(data.isActive !== undefined && { isActive: data.isActive }),
				...(data.invoiceFooterNote !== undefined && { invoiceFooterNote: data.invoiceFooterNote === '' ? null : data.invoiceFooterNote }),
				...(data.invoiceDueDays !== undefined && { invoiceDueDays: data.invoiceDueDays }),
				...(data.posInvoiceThreshold !== undefined && { posInvoiceThreshold: data.posInvoiceThreshold }),
				// Dados de emitente e parametrização fiscal impressos na factura
				...(data.city !== undefined && { city: data.city === '' ? null : data.city }),
				...(data.postalCode !== undefined && { postalCode: data.postalCode === '' ? null : data.postalCode }),
				...(data.country !== undefined && { country: data.country === '' ? null : data.country }),
				...(data.fax !== undefined && { fax: data.fax === '' ? null : data.fax }),
				...(data.logoUrl !== undefined && { logoUrl: data.logoUrl === '' ? null : data.logoUrl }),
				...(data.bankName !== undefined && { bankName: data.bankName === '' ? null : data.bankName }),
				...(data.bankAccount !== undefined && { bankAccount: data.bankAccount === '' ? null : data.bankAccount }),
				...(data.iban !== undefined && { iban: data.iban === '' ? null : data.iban }),
				...(data.agtValidationNumber !== undefined && { agtValidationNumber: data.agtValidationNumber === '' ? null : data.agtValidationNumber }),
				...(data.taxExemptionCode !== undefined && { taxExemptionCode: data.taxExemptionCode === '' ? null : data.taxExemptionCode }),
				...(data.taxExemptionReason !== undefined && { taxExemptionReason: data.taxExemptionReason === '' ? null : data.taxExemptionReason }),
				...(data.retentionEntity !== undefined && { retentionEntity: data.retentionEntity === '' ? null : data.retentionEntity }),
				...(data.retentionRate !== undefined && { retentionRate: data.retentionRate })
			}
			});

			// Reprovisiona quando o plano muda, e também quando ainda não existe
			// subscrição — é isso que repara as organizações criadas antes desta
			// correção, que ficaram com `planId` mas sem subscrição nem módulos.
			if (planId && (planId !== previous?.planId || !existingSubscription)) {
				await this.provisionPlan(tx, id, planId);
			}

			return organization;
		});
	}

	async delete(id: string) {
		// 1. Check if organization exists
		const org = await prisma.organization.findUnique({
			where: { id },
			select: {
				id: true,
				users: { take: 1 },
				roles: {
					select: { id: true }
				},
				_count: {
					select: { users: true }
				}
			}
		});

		if (!org) {
			throw new Error('Organização não encontrada');
		}

		// 2. Perform deletion in a transaction (delete users along with org)
		return prisma.$transaction(async (tx) => {
			const roleIds = org.roles.map(r => r.id);

			// Delete user roles first
			await tx.userRole.deleteMany({
				where: { 
					role: {
						organizationId: id
					}
				}
			});

			// Delete role permissions
			if (roleIds.length > 0) {
				await tx.rolePermission.deleteMany({
					where: { roleId: { in: roleIds } }
				});

				// Delete roles
				await tx.role.deleteMany({
					where: { organizationId: id }
				});
			}

			// Delete users from organization
			await tx.user.deleteMany({
				where: { organizationId: id }
			});

			// Delete organization modules
			await tx.organizationModule.deleteMany({
				where: { organizationId: id }
			});

			// Delete activation codes
			await tx.activationCode.deleteMany({
				where: { organizationId: id }
			});

			// Finally delete the organization
			return tx.organization.delete({
				where: { id }
			});
		}, {
			timeout: 10000 // Set a 10s timeout for the transaction
		});
	}

	/**
	 * `upsert` e não `create`: as mudanças de plano e o cancelamento desativam
	 * a linha em vez de a apagar, pelo que reativar um módulo que a organização
	 * já teve rebentava com violação de chave única em vez de o reativar.
	 */
	async assignModule(organizationId: string, moduleId: string) {
		return prisma.organizationModule.upsert({
			where: {
				organizationId_moduleId: { organizationId, moduleId }
			},
			update: { isActive: true },
			create: { organizationId, moduleId, isActive: true }
		});
	}

	/** Desativa em vez de apagar, para ser coerente com o resto do sistema. */
	async removeModule(organizationId: string, moduleId: string) {
		return prisma.organizationModule.updateMany({
			where: {
				organizationId,
				moduleId
			},
			data: { isActive: false }
		});
	}
}

export const organizationService = new OrganizationService();