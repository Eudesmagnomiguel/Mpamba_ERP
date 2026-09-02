import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.config.js';
import { ActivationService } from './activation.service.js';
import { NotificationService } from './notification.service.js';
import { RoleTemplateService } from './role-template.service.js';
import { sendEmail } from '../../shared/utils/email.utils.js';
import { JwtStrategy } from '../../shared/utils/jwt.strategy.js';
import { RefreshStrategy } from '../../shared/utils/refresh.strategy.js';
import type { RegisterInput } from '../../shared/schema/auth.schema.js';
import type { AuthUser, LoginResponse, RefreshTokenResponse } from '../../shared/types/core/auth.types.js';
import {
	getSubscriptionApprovedTemplate,
	getOrganizationActivatedTemplate
} from '../../shared/utils/email-templates.utils.js';
import ENV from '../../shared/utils/env.utils.js';

export class AuthService {
	/**
	 * Atualiza o próprio perfil do utilizador autenticado (nome, email, username, palavra-passe).
	 */
	static async updateProfile(userId: string, data: {
		name?: string;
		email?: string;
		username?: string;
		currentPassword?: string;
		newPassword?: string;
	}) {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw new Error('Utilizador não encontrado');

		if (data.email && data.email.toLowerCase().trim() !== user.email) {
			const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
			if (existing) throw new Error('Este email já está em uso');
		}

		if (data.username && data.username !== user.username) {
			const existing = await prisma.user.findUnique({ where: { username: data.username } });
			if (existing) throw new Error('Este nome de utilizador já está em uso');
		}

		const updateData: any = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim();
		if (data.username !== undefined) updateData.username = data.username || null;

		if (data.newPassword) {
			if (!data.currentPassword) throw new Error('Informe a palavra-passe atual para definir uma nova.');
			const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
			if (!isValid) throw new Error('Palavra-passe atual incorreta.');
			updateData.passwordHash = await bcrypt.hash(data.newPassword, 10);
		}

		const updated = await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				name: true,
				email: true,
				username: true,
				urlImageProfile: true,
				isActive: true,
				organizationId: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return updated;
	}


	static async login(email: string, password: string): Promise<LoginResponse> {
		const identifier = email.toLowerCase().trim();

		const user = await prisma.user.findFirst({
			where: { OR: [{ email: identifier }, { username: identifier }] },
			include: {
				roles: {
					include: {
						role: {
							include: {
								permissions: {
									include: {
										permission: true
									}
								}
							}
						}
					}
				},
				organization: true,
			},
		});

		// Mensagem genérica para não revelar se o email existe
		if (!user) {
			throw new Error('Credenciais inválidas');
		}

		const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
		if (!isPasswordValid) {
			throw new Error('Credenciais inválidas');
		}

		// Check if user account is active
		if (!user.isActive) {
			console.log(`[Login] User is inactive: ${email}`);
			throw new Error('Sua conta está inativa. Contacte o administrador da sua organização para ativar a sua conta.');
		}

		// Check if user's organization is active (pending organizations cannot login)
		if (user.organization && !user.organization.isActive) {
			console.log(`[Login] Organization is pending for user: ${email}`);
			throw new Error('Sua organização está pendente de aprovação. Por favor, aguarde a confirmação da nossa equipa.');
		}

		const roles = user.roles.map((r: any) => r.role.name);

		const accessToken = JwtStrategy.sign({
			sub: user.id,
			organizationId: user.organizationId,
			roles,
		});

		const refreshToken = RefreshStrategy.sign({ sub: user.id });

		// Login successful

		return {
			accessToken,
			refreshToken,
			user: await AuthService.buildUserProfile(user),
		};
	}

	/** Tudo o que o perfil do utilizador precisa de carregar numa só query. */
	private static readonly profileInclude = {
		roles: {
			include: {
				role: {
					include: {
						permissions: { include: { permission: true } }
					}
				}
			}
		},
		organization: true,
	} as const;

	/**
	 * Perfil actual do utilizador: papéis, permissões e módulos activos.
	 *
	 * Os módulos não vão no JWT — são lidos da base de dados a cada chamada.
	 * É isto que permite ao frontend refrescar o acesso depois de o backoffice
	 * activar uma subscrição, sem o utilizador ter de sair e voltar a entrar.
	 */
	static async getProfile(userId: string): Promise<AuthUser> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: AuthService.profileInclude,
		});

		if (!user) {
			throw new Error('Utilizador não encontrado');
		}

		return AuthService.buildUserProfile(user);
	}

	private static async buildUserProfile(user: any): Promise<AuthUser> {
		const roles = user.roles.map((r: any) => r.role.name);

		// Extract unique permissions from all roles
		const permissions = new Set<string>();
		user.roles.forEach((userRole: any) => {
			userRole.role.permissions.forEach((rolePermission: any) => {
				permissions.add(rolePermission.permission.code);
			});
		});

		// Fetch active modules
		// Super Admin (no organizationId) gets all modules, others get organization modules
		let activeModules: any[] = [];

		if (!user.organizationId) {
			// Super Admin: get all modules
			activeModules = await prisma.module.findMany();
		} else {
			// Organization user: get only active modules for their organization
			activeModules = await prisma.organizationModule.findMany({
				where: { organizationId: user.organizationId, isActive: true },
				include: { module: true }
			});
		}

		let moduleCodes = activeModules.map((m: any) => m.code || m.module?.code);

		// Se o admin da organização restringiu explicitamente os módulos deste
		// funcionário (hasCustomModuleAccess), filtra pela sua atribuição pessoal.
		// Caso contrário mantém acesso a todos os módulos ativos da organização
		// (comportamento por defeito, compatível com utilizadores já existentes).
		if (user.organizationId && user.hasCustomModuleAccess) {
			const userModules = await prisma.userModule.findMany({
				where: { userId: user.id },
				include: { module: true }
			});
			const assignedCodes = new Set(userModules.map((um) => um.module.code));
			moduleCodes = moduleCodes.filter((code: string) => assignedCodes.has(code));
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			username: user.username,
			role: roles[0] || 'user',
			permissions: Array.from(permissions),
			modules: moduleCodes,
			organizationId: user.organizationId,
			organization: user.organization ? {
				id: user.organization.id,
				name: user.organization.name,
				nif: user.organization.nif,
			} : null,
			onboardingCompletedAt: user.onboardingCompletedAt ? user.onboardingCompletedAt.toISOString() : null,
		};
	}

	static async completeOnboarding(userId: string) {
		const user = await prisma.user.update({
			where: { id: userId },
			data: { onboardingCompletedAt: new Date() }
		});

		return { onboardingCompletedAt: user.onboardingCompletedAt!.toISOString() };
	}

	static async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
		const payload = RefreshStrategy.verify(refreshToken);

		const user = await prisma.user.findUnique({
			where: { id: payload.sub },
			include: { roles: { include: { role: true } } },
		});

		if (!user || !user.isActive) {
			throw new Error('Usuário inválido');
		}

		const roles = user.roles.map((r: any) => r.role.name);

		const newAccessToken = JwtStrategy.sign({
			sub: user.id,
			organizationId: user.organizationId,
			roles,
		});

		return { accessToken: newAccessToken };
	}

	static async register(data: RegisterInput) {
		const { orgName, adminName, password, planId } = data;

		// O login procura o utilizador pelo email em minúsculas; se o registo
		// gravasse "Admin@Empresa.ao" tal como foi escrito, esse utilizador
		// nunca mais conseguiria entrar. Normalizamos aqui, uma única vez.
		const adminEmail = data.adminEmail.toLowerCase().trim();
		const nif = data.nif.trim();
		const orgEmail = data.orgEmail?.trim().toLowerCase() || null;

		// Check if email exists
		const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
		if (existingUser) {
			throw new Error('Este email já está em uso');
		}

		// O NIF tem índice único: sem esta verificação a candidatura falhava com
		// um erro cru do Prisma que o cliente via apenas como "Falha no registro".
		const existingOrg = await prisma.organization.findUnique({ where: { nif } });
		if (existingOrg) {
			throw new Error('Já existe uma organização registada com este NIF. Se é a sua empresa, faça login ou contacte o suporte.');
		}

		// Validate plan exists
		const plan = await prisma.plan.findUnique({ where: { id: planId } });
		if (!plan) {
			throw new Error('Plano selecionado não existe');
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const allPermissions = await prisma.permission.findMany({ select: { id: true } });

		// Tudo numa transacção: se um dos passos falhar a meio (perfis, papéis),
		// nada fica gravado. Antes ficava uma organização órfã com o NIF e o
		// email já ocupados, e todas as tentativas seguintes falhavam com
		// "Este email já está em uso" sem que a conta existisse de facto.
		const organization = await prisma.$transaction(async (tx) => {
			const org = await tx.organization.create({
				data: {
					name: orgName.trim(),
					nif,
					address: data.address?.trim() || null,
					phone: data.phone?.trim() || null,
					email: orgEmail,
					isActive: false,
					planId
				}
			});

			const user = await tx.user.create({
				data: {
					name: adminName.trim(),
					email: adminEmail,
					passwordHash,
					isActive: false,
					organizationId: org.id
				}
			});

			const adminRole = await tx.role.create({
				data: {
					name: 'Administrador',
					description: 'Acesso total à organização',
					organizationId: org.id,
					permissions: {
						createMany: {
							data: allPermissions.map((permission) => ({ permissionId: permission.id }))
						}
					}
				}
			});

			await tx.userRole.create({
				data: {
					userId: user.id,
					roleId: adminRole.id
				}
			});

			return org;
		}, { timeout: 20000 });

		// Criar os perfis pré-configurados (Diretor Geral, Tesoureiro, Facturista, etc.).
		// Fora da transacção: é idempotente e uma falha aqui não deve anular
		// uma candidatura já válida — os perfis podem ser recriados depois.
		try {
			await RoleTemplateService.createRoleTemplatesForOrganization(organization.id);
		} catch (error) {
			console.error(`[Register] Falha ao criar perfis pré-configurados para ${organization.id}:`, error);
		}

		// Generate WhatsApp contact link
		const whatsappNumber = "+244938629420";
		const whatsappMessage = encodeURIComponent(
			`Olá! Registei a minha organização "${orgName}" na Mpamba e gostaria de negociar o pagamento do plano ${plan.name}.`
		);
		const whatsappLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${whatsappMessage}`;

		return { 
			message: 'Candidatura submetida com sucesso! A equipa Mpamba irá rever o seu pedido.',
			organizationId: organization.id,
			whatsappLink,
			whatsappNumber
		};
	}

	static async listPendingOrganizations() {
		return prisma.organization.findMany({
			where: { isActive: false },
			include: {
				plan: true,
				users: {
					where: { isActive: false },
					select: {
						id: true,
						name: true,
						email: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});
	}

	static async approveOrganization(id: string) {
		const organization = await prisma.organization.findUnique({
			where: { id },
			include: { users: true, plan: true }
		});

		if (!organization) {
			throw new Error('Organização não encontrada');
		}

		if (organization.isActive) {
			throw new Error('Esta organização já está ativa');
		}

		// 1. Generate Activation Code
		const activationCode = await ActivationService.generateCode(id);

		// 2. Find the admin user (first user created for this org)
		const adminUser = organization.users[0];
		if (!adminUser) {
			throw new Error('Utilizador administrador não encontrado para esta organização');
		}

		// 3. Send Activation Email with code
		console.log(`[Approve] Enviando código de ativação ${activationCode.code} para ${adminUser.email}...`);
		
		const emailResult = await sendEmail({
			to: adminUser.email,
			subject: 'Subscrição Mpamba Aprovada!',
			html: getSubscriptionApprovedTemplate(
				adminUser.name,
				organization.name,
				organization.plan?.name,
				activationCode.code,
				organization.id
			)
		});

		if (!emailResult.success) {
			console.error(`[Approve] Falha ao enviar email para ${adminUser.email}: ${emailResult.error}`);
			throw new Error(`Organização aprovada, mas o envio do email para ${adminUser.email} falhou: ${emailResult.error}`);
		}

		console.log(`[Approve] Email enviado com sucesso para ${adminUser.email}`);

		return { 
			message: 'Organização aprovada com sucesso. Código de ativação enviado por email.',
			activationCode: activationCode.code
		};
	}

	static async activate(organizationId: string) {
		const organization = await prisma.organization.findUnique({
			where: { id: organizationId }
		});

		if (!organization) {
			throw new Error('Organização não encontrada');
		}

		if (organization.isActive) {
			throw new Error('Organização já está ativa');
		}

		// Activate organization and all its users
		await prisma.organization.update({
			where: { id: organizationId },
			data: { isActive: true }
		});

		await prisma.user.updateMany({
			where: { organizationId },
			data: { isActive: true }
		});

		return { message: 'Conta ativada com sucesso!' };
	}

	// Super Admin Direct Activation - Without Code
	static async activateOrganizationDirectly(organizationId: string) {
		const organization = await prisma.organization.findUnique({
			where: { id: organizationId },
			include: {
				plan: {
					include: {
						modules: true
					}
				},
				users: true
			}
		});

		if (!organization) {
			throw new Error('Organização não encontrada');
		}

		if (organization.isActive) {
			throw new Error('Esta organização já está ativa');
		}

		// 1. Mark organization as active
		const activatedOrganization = await prisma.organization.update({
			where: { id: organizationId },
			data: { isActive: true }
		});

		// 2. Activate all users in this organization
		await prisma.user.updateMany({
			where: { organizationId: organization.id },
			data: { isActive: true }
		});

		// 3. Provision modules based on plan
		if (organization.plan && organization.plan.modules) {
			for (const planModule of organization.plan.modules) {
				await prisma.organizationModule.upsert({
					where: {
						organizationId_moduleId: {
							organizationId: organization.id,
							moduleId: planModule.moduleId
						}
					},
					update: { isActive: true },
					create: {
						organizationId: organization.id,
						moduleId: planModule.moduleId,
						isActive: true
					}
				});
			}
		}

		// 3.5 Criar/Atualizar a Subscrição, para que o plano e módulos apareçam
		// imediatamente em /subscription/me, sem precisar de código de ativação
		if (organization.planId) {
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 12);

			await prisma.subscription.upsert({
				where: { organizationId: organization.id },
				update: {
					planId: organization.planId,
					status: 'ACTIVE',
					endDate,
				},
				create: {
					organizationId: organization.id,
					planId: organization.planId,
					status: 'ACTIVE',
					endDate,
				},
			});
		}

		// 4. Send notification email to admin user
		const adminUser = organization.users[0];
		if (adminUser) {
			await sendEmail({
				to: adminUser.email,
				subject: 'Sua Organização foi Ativada!',
				html: getOrganizationActivatedTemplate(adminUser.name, organization.name)
			});
			await NotificationService.notifyUser(adminUser.id, {
				title: 'Organização Ativada',
				message: `A organização ${organization.name} foi ativada com sucesso.`,
				type: 'SUCCESS'
			});
		}

		return { message: 'Organização ativada com sucesso!' };
	}

	/**
	 * Ativa uma organização usando um código de ativação.
	 * O código ativa a organização E subscreve ao plano automaticamente.
	 */
	static async activateWithCode(organizationId: string, code: string) {
		const organization = await prisma.organization.findUnique({
			where: { id: organizationId },
			include: { users: true, plan: true }
		});

		if (!organization) {
			throw new Error('Organização não encontrada');
		}

		if (organization.isActive) {
			throw new Error('Esta organização já está ativa');
		}

		// Import SubscriptionService
		const { SubscriptionService } = await import('./subscription.service.js');

		// 1. Use activation code and subscribe to plan (handles transaction)
		const subscriptionResult = await SubscriptionService.useActivationCode(organizationId, code);

		// 2. Activate organization
		await prisma.organization.update({
			where: { id: organizationId },
			data: { isActive: true }
		});

		// 3. Activate all users in this organization
		await prisma.user.updateMany({
			where: { organizationId },
			data: { isActive: true }
		});

		// 4. Send notification email to admin user
		const adminUser = organization.users[0];
		if (adminUser) {
			await sendEmail({
				to: adminUser.email,
				subject: 'Sua Organização foi Ativada com Sucesso!',
				html: getOrganizationActivatedTemplate(adminUser.name, organization.name)
			});
			await NotificationService.notifyUser(adminUser.id, {
				title: 'Organização Ativada',
				message: `A organização ${organization.name} foi ativada com sucesso e a subscrição está ativa.`,
				type: 'SUCCESS'
			});
		}

		return {
			message: 'Organização ativada com sucesso! Subscrição no plano ativa.',
			subscription: subscriptionResult
		};
	}
}