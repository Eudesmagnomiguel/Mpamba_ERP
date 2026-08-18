import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.config.js';
import { sendEmail } from '../../shared/utils/email.utils.js';
import { getPasswordResetTemplate } from '../../shared/utils/email-templates.utils.js';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export class PasswordResetService {
	/**
	 * Gera um token de recuperação e envia por email.
	 * Nunca revela se o email existe ou não (mensagem sempre genérica).
	 */
	static async requestReset(email: string) {
		const normalizedEmail = email.toLowerCase().trim();
		const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

		if (user) {
			// Invalidar tokens anteriores não usados para este utilizador
			await prisma.passwordResetToken.deleteMany({
				where: { userId: user.id, isUsed: false }
			});

			const token = crypto.randomBytes(32).toString('hex');
			const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

			await prisma.passwordResetToken.create({
				data: { token, userId: user.id, expiresAt }
			});

			const resetLink = `http://localhost:3000/reset-password?token=${token}`;

			const emailResult = await sendEmail({
				to: user.email,
				subject: 'Recuperação de Senha — Mpamba',
				html: getPasswordResetTemplate(user.name, resetLink)
			});

			if (!emailResult.success) {
				console.error(`[PasswordReset] Falha ao enviar email para ${user.email}: ${emailResult.error}`);
			}
		}

		return { message: 'Se o email existir na nossa base de dados, enviámos instruções de recuperação.' };
	}

	/**
	 * Valida o token e define a nova senha (já hasheada).
	 */
	static async resetPassword(token: string, newPassword: string) {
		const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

		if (!resetToken || resetToken.isUsed || resetToken.expiresAt < new Date()) {
			throw new Error('Token de recuperação inválido ou expirado');
		}

		const passwordHash = await bcrypt.hash(newPassword, 10);

		await prisma.$transaction([
			prisma.user.update({
				where: { id: resetToken.userId },
				data: { passwordHash }
			}),
			prisma.passwordResetToken.update({
				where: { id: resetToken.id },
				data: { isUsed: true, usedAt: new Date() }
			})
		]);

		return { message: 'Senha redefinida com sucesso.' };
	}
}
