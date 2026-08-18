import ENV  from "./env.utils.js";
import transporter from "../../config/transporter.config.js";
import type { EmailOptions, EmailResult } from "../types/index.types.js";

/**
 * Verifica se a conexão com o servidor SMTP está funcionando
 */
const verifyEmailConnection = async (): Promise<boolean> => {
	try {
		await transporter.verify();
		console.log("✅ Conexão com servidor de email estabelecida");
		return true;
	} catch (error) {
		console.error("❌ Erro ao conectar com servidor de email:", error);
		return false;
	}
};

/**
 * Função genérica para enviar emails
 */
const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
	try {

		const info = await transporter.sendMail({
			from: `"Mpamba - Sistema de faturamento" <${ENV.EMAIL_USER || "emanuelmalungo25@gmail.com"}>`,
			to: options.to,
			subject: options.subject,
			text: options.text,
			html: options.html,
			attachments: options.attachments,
		});

		console.log(`✅ Email enviado para ${options.to}: ${info.messageId}`);
		return {
			success: true,
			messageId: info.messageId,
		};

	} catch (error) {
		console.error(`❌ Erro ao enviar email para ${options.to}:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Erro desconhecido",
		};
	}
};

export { sendEmail, verifyEmailConnection };