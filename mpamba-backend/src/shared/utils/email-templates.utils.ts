export const getSubscriptionApprovedTemplate = (
	adminName: string,
	organizationName: string,
	planName: string | undefined,
	activationCode: string,
	organizationId: string
): string => {
	return `
				<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
					<h2 style="color: #272264; text-align: center;">Boas Notícias!</h2>
					<p>Olá <strong>${adminName}</strong>,</p>
					<p>Temos o prazer de informar que a subscrição da <strong>${organizationName}</strong> no plano <strong>${planName || ''}</strong> foi aprovada pela nossa equipa!</p>
					<p>Para ativar a sua conta e começar a usar o sistema, utilize o código de ativação abaixo:</p>
					<div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 28px; font-weight: bold; border-radius: 8px; color: #584BBD; letter-spacing: 5px; margin: 20px 0;">
						${activationCode}
					</div>
					<p>Você pode ativar a sua conta clicando no botão abaixo:</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="http://localhost:3000/activate?orgId=${organizationId}&code=${activationCode}" 
						   style="background-color: #584BBD; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
							Ativar Meu Sistema Agora
						</a>
					</div>
					<p>Desejamos muito sucesso na gestão da sua empresa!</p>
					<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
					<p style="font-size: 12px; color: #666; text-align: center;">Equipe Mpamba</p>
				</div>
			`;
};

export const getOrganizationActivatedTemplate = (
	adminName: string,
	organizationName: string
): string => {
	return `
		<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
			<h2 style="color: #272264; text-align: center;">Organização Ativada com Sucesso!</h2>
			<p>Olá <strong>${adminName}</strong>,</p>
			<p>Temos o prazer de informar que a sua organização <strong>${organizationName}</strong> foi ativada com sucesso!</p>
			<p>Você e sua equipa podem agora fazer login e começar a usar o sistema <strong>imediatamente</strong>.</p>
			<div style="text-align: center; margin: 30px 0;">
				<a href="http://localhost:3000/signin" 
					style="background-color: #584BBD; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
					Acessar o Sistema Agora
				</a>
			</div>
			<p>Desejamos muito sucesso na gestão da sua empresa!</p>
			<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
			<p style="font-size: 12px; color: #666; text-align: center;">Equipe Mpamba</p>
		</div>
	`;
};

export const getPasswordResetTemplate = (
	userName: string,
	resetLink: string
): string => {
	return `
		<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
			<h2 style="color: #272264; text-align: center;">Recuperação de Senha</h2>
			<p>Olá <strong>${userName}</strong>,</p>
			<p>Recebemos um pedido para redefinir a senha da sua conta Mpamba. Se não foi você quem pediu, pode ignorar este email com segurança.</p>
			<p>Para definir uma nova senha, clique no botão abaixo (o link expira em 1 hora):</p>
			<div style="text-align: center; margin: 30px 0;">
				<a href="${resetLink}"
					style="background-color: #584BBD; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
					Redefinir Senha
				</a>
			</div>
			<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
			<p style="font-size: 12px; color: #666; text-align: center;">Equipe Mpamba</p>
		</div>
	`;
};

export const getInvoiceEmailTemplate = (
	customerName: string,
	invoiceNumber: string,
	amount: string,
	currency: string
): string => {
	return `
		<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
			<h2 style="color: #272264; text-align: center;">Sua Fatura Chegou</h2>
			<p>Olá <strong>${customerName}</strong>,</p>
			<p>Anexamos a sua fatura <strong>${invoiceNumber}</strong> no valor de <strong>${amount} ${currency}</strong>.</p>
			<p>Por favor, encontre o documento em PDF anexo a este email.</p>
			<p>Se tiver qualquer dúvida, entre em contacto connosco.</p>
			<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
			<p style="font-size: 12px; color: #666; text-align: center;">Este é um email automático, por favor não responda.</p>
		</div>
	`;
};
