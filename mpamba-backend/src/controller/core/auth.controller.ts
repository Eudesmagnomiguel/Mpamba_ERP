import type { Response } from 'express';
import { AuthService } from '../../services/core/auth.service.js';
import { PasswordResetService } from '../../services/core/password-reset.service.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import { registerSchema } from '../../shared/schema/auth.schema.js';
import { toFriendlyErrorMessage, isInfrastructureError } from '../../shared/utils/db-error.utils.js';

/**
 * Responde a um erro apanhado num handler de autenticação.
 *
 * Falhas de infraestrutura (base de dados em baixo) devolvem 503 e não o
 * `failureStatus` do endpoint: caso contrário o rate limiter conta-as como
 * tentativas inválidas e bloqueia o IP por 15 minutos sem culpa do utilizador.
 */
function respondWithAuthError(
	res: Response,
	error: any,
	failureStatus: number,
	fallback: string
) {
	if (isInfrastructureError(error)) {
		return res.status(503).json({
			status: 'error',
			message: toFriendlyErrorMessage(error, fallback),
		});
	}

	return res.status(failureStatus).json({
		status: 'error',
		message: toFriendlyErrorMessage(error, fallback),
	});
}

export class AuthController {
	/**
	 * Login - POST /auth/login
	 */
	static async login(req: AuthRequest, res: Response) {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				return res.status(400).json({
					status: 'error',
					message: 'Email e password são obrigatórios'
				});
			}

			const result = await AuthService.login(email, password);
			return res.status(200).json({
				status: 'success',
				data: result,
				message: 'Login realizado com sucesso'
			});
		} catch (error: any) {
			console.error('[Login] Falha ao autenticar:', error);
			return respondWithAuthError(res, error, 401, 'Falha na autenticação');
		}
	}

	/**
	 * Refresh Token - POST /auth/refresh
	 */
	static async refresh(req: AuthRequest, res: Response) {
		try {
			const { refreshToken } = req.body;

			if (!refreshToken) {
				return res.status(400).json({
					status: 'error',
					message: 'Refresh token é obrigatório'
				});
			}

			const result = await AuthService.refresh(refreshToken);
			return res.status(200).json({
				status: 'success',
				data: result,
				message: 'Token renovado com sucesso'
			});
		} catch (error: any) {
			console.error('[Refresh] Falha ao renovar token:', error);
			return respondWithAuthError(res, error, 401, 'Falha ao renovar token');
		}
	}

	/**
	 * Register - POST /auth/register
	 */
	static async register(req: AuthRequest, res: Response) {
		try {
			// O corpo era usado sem validação: um campo em falta chegava ao
			// Prisma e voltava como "Falha no registro", sem dizer o que faltava.
			const parsed = registerSchema.safeParse(req.body);
			if (!parsed.success) {
				const issue = parsed.error.issues[0];
				return res.status(400).json({
					status: 'error',
					message: issue ? `${issue.path.join('.') || 'Dados'}: ${issue.message}` : 'Dados inválidos',
					details: parsed.error.issues,
				});
			}

			const result = await AuthService.register(parsed.data);
			return res.status(201).json({
				status: 'success',
				data: result,
				message: 'Registro realizado com sucesso'
			});
		} catch (error: any) {
			console.error('[Register] Falha ao registar:', error);

			// Corrida entre duas candidaturas simultâneas com o mesmo NIF/email.
			if (error?.code === 'P2002') {
				const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : error?.meta?.target;
				return res.status(409).json({
					status: 'error',
					message: target?.includes('nif')
						? 'Já existe uma organização registada com este NIF.'
						: 'Já existe uma conta registada com estes dados.',
				});
			}

			return respondWithAuthError(res, error, 400, 'Falha no registro');
		}
	}

	/**
	 * Logout - POST /auth/logout
	 */
	static async logout(req: AuthRequest, res: Response) {
		try {
			// Logout é geralmente apenas um evento client-side
			// O token é invalidado no client deletando-o
			return res.status(200).json({
				status: 'success',
				message: 'Logout realizado com sucesso'
			});
		} catch (error: any) {
			return res.status(400).json({
				status: 'error',
				message: error.message || 'Falha no logout'
			});
		}
	}

	/**
	 * Activate Organization - POST /auth/activate
	 */
	static async activate(req: AuthRequest, res: Response) {
		try {
			const { organizationId } = req.body;

			if (!organizationId) {
				return res.status(400).json({
					status: 'error',
					message: 'Organization ID é obrigatório'
				});
			}

			const result = await AuthService.activate(organizationId);
			return res.status(200).json({
				status: 'success',
				data: result,
				message: 'Organização ativada com sucesso'
			});
		} catch (error: any) {
			return res.status(400).json({
				status: 'error',
				message: error.message || 'Falha ao ativar organização'
			});
		}
	}

	/**
	 * Get Current User - GET /auth/me
	 */
	static async me(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res.status(401).json({
					status: 'error',
					message: 'Não autenticado'
				});
			}

			// Perfil lido da base de dados, não o payload do JWT: os módulos e as
			// permissões mudam quando o backoffice altera a subscrição, e o token
			// só é reemitido no login. Sem isto, o utilizador teria de sair e
			// voltar a entrar para ver um módulo acabado de activar.
			const user = await AuthService.getProfile(req.user.sub);

			return res.status(200).json({
				status: 'success',
				data: user,
				message: 'Dados do utilizador obtidos com sucesso'
			});
		} catch (error: any) {
			return res.status(400).json({
				status: 'error',
				message: error.message || 'Falha ao obter dados do utilizador'
			});
		}
	}

	/**
	 * Atualizar o próprio perfil - PUT /auth/me
	 */
	static async updateMe(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res.status(401).json({
					status: 'error',
					message: 'Não autenticado'
				});
			}

			const { name, email, username, currentPassword, newPassword } = req.body;
			const updated = await AuthService.updateProfile(req.user.sub, {
				name, email, username, currentPassword, newPassword,
			});

			return res.status(200).json({
				status: 'success',
				data: updated,
				message: 'Perfil atualizado com sucesso'
			});
		} catch (error: any) {
			return res.status(400).json({
				status: 'error',
				message: toFriendlyErrorMessage(error, 'Falha ao atualizar perfil')
			});
		}
	}

	/**
	 * Complete Onboarding - POST /auth/onboarding/complete
	 */
	static async completeOnboarding(req: AuthRequest, res: Response) {
		try {
			if (!req.user) {
				return res.status(401).json({
					status: 'error',
					message: 'Não autenticado'
				});
			}

			const result = await AuthService.completeOnboarding(req.user.sub);
			return res.status(200).json({
				status: 'success',
				data: result,
				message: 'Onboarding concluído com sucesso'
			});
		} catch (error: any) {
			return res.status(400).json({
				status: 'error',
				message: error.message || 'Falha ao concluir onboarding'
			});
		}
	}

	/**
	 * List Pending Organizations - GET /auth/pending
	 */
	static async listPending(req: AuthRequest, res: Response) {
		try {
			const result = await AuthService.listPendingOrganizations();
			return res.status(200).json({
				status: 'success',
				data: result,
				message: 'Organizações pendentes listadas com sucesso'
			});
		} catch (error: any) {
			return res.status(400).json({
				status: 'error',
				message: error.message || 'Falha ao listar organizações pendentes'
			});
		}
	}

	/**
	 * Approve Organization - POST /auth/approve/:id
	 */
	static async approve(req: AuthRequest, res: Response) {
		try {
			const id = String(req.params.id);

			if (!id) {
				return res.status(400).json({
					status: 'error',
					message: 'Organization ID é obrigatório'
				});
			}

			const result = await AuthService.approveOrganization(id);
			return res.status(200).json({
				status: 'success',
				data: result,
				message: 'Organização aprovada com sucesso'
			});
		} catch (error: any) {
			return res.status(400).json({
				status: 'error',
				message: error.message || 'Falha ao aprovar organização'
			});
		}
	}

	/**
	 * Activate Organization Directly (Super Admin) - POST /auth/activate-directly/:organizationId
	 */
	static async activateDirectly(req: AuthRequest, res: Response) {
		try {
			const organizationId = String(req.params.organizationId);

			if (!organizationId) {
				return res.status(400).json({
					status: 'error',
					message: 'Organization ID é obrigatório'
				});
			}

			const result = await AuthService.activateOrganizationDirectly(organizationId);
			return res.status(200).json({
				status: 'success',
				data: result,
				message: 'Organização ativada com sucesso'
			});
		} catch (error: any) {
			return res.status(400).json({
				status: 'error',
				message: error.message || 'Falha ao ativar organização'
			});
		}
	}

	/**
	 * Forgot Password - POST /auth/forgot-password
	 */
	static async forgotPassword(req: AuthRequest, res: Response) {
		try {
			const { email } = req.body;

			if (!email) {
				return res.status(400).json({
					status: 'error',
					message: 'Email é obrigatório'
				});
			}

			const result = await PasswordResetService.requestReset(email);
			return res.status(200).json({
				status: 'success',
				data: result,
				message: result.message
			});
		} catch (error: any) {
			console.error('[ForgotPassword] Falha ao processar pedido:', error);
			return respondWithAuthError(res, error, 400, 'Falha ao processar pedido de recuperação de senha');
		}
	}

	/**
	 * Reset Password - POST /auth/reset-password
	 */
	static async resetPassword(req: AuthRequest, res: Response) {
		try {
			const { token, password } = req.body;

			if (!token || !password) {
				return res.status(400).json({
					status: 'error',
					message: 'Token e nova senha são obrigatórios'
				});
			}

			const result = await PasswordResetService.resetPassword(token, password);
			return res.status(200).json({
				status: 'success',
				data: result,
				message: result.message
			});
		} catch (error: any) {
			console.error('[ResetPassword] Falha ao redefinir senha:', error);
			return respondWithAuthError(res, error, 400, 'Falha ao redefinir senha');
		}
	}

	/**
	 * Activate Organization with Code - POST /auth/activate-with-code
	 * User submits the activation code they received via email
	 */
	static async activateWithCode(req: AuthRequest, res: Response) {
		try {
			const { organizationId, code } = req.body;

			if (!organizationId || !code) {
				return res.status(400).json({
					status: 'error',
					message: 'Organization ID e código são obrigatórios'
				});
			}

			const result = await AuthService.activateWithCode(organizationId, code);
			return res.status(200).json({
				status: 'success',
				data: result,
				message: 'Organização ativada com sucesso e subscrição ativa'
			});
		} catch (error: any) {
			return res.status(400).json({
				status: 'error',
				message: error.message || 'Falha ao ativar organização com código'
			});
		}
	}
}
