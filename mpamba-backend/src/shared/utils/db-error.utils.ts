/**
 * Traduz erros de baixo nível (Prisma / rede) para mensagens amigáveis em
 * português, evitando expor stack traces e detalhes de infraestrutura ao
 * cliente. Erros de negócio (ex.: "Credenciais inválidas") passam intactos.
 */
const CONNECTION_ERROR_MARKERS = [
	"Can't reach database server",
	'ECONNREFUSED',
	'ETIMEDOUT',
	'ENOTFOUND',
	'Connection terminated',
	'connection refused',
	'PrismaClientInitializationError',
	'PrismaClientRustPanicError',
];

const CONNECTION_ERROR_CODES = new Set([
	'P1001', // Can't reach database server
	'P1002', // Database server timed out
	'P1008', // Operations timed out
	'P1017', // Server closed the connection
	// Erros de socket: o Prisma expõe-nos em `error.code`, não na mensagem.
	'ECONNREFUSED',
	'ETIMEDOUT',
	'ENOTFOUND',
	'ECONNRESET',
	'EHOSTUNREACH',
]);

/**
 * Distingue falhas de infraestrutura (base de dados inacessível) de erros de
 * negócio. Quem responde ao cliente usa isto para devolver 503 em vez de 4xx —
 * uma falha nossa não deve ser contada como tentativa inválida do utilizador.
 */
export function isInfrastructureError(error: any): boolean {
	const code = error?.code;
	const name = error?.name;
	const message = String(error?.message || '');

	return (
		(code && CONNECTION_ERROR_CODES.has(code)) ||
		name === 'PrismaClientInitializationError' ||
		name === 'PrismaClientRustPanicError' ||
		CONNECTION_ERROR_MARKERS.some((marker) => message.includes(marker))
	);
}

export function toFriendlyErrorMessage(error: any, fallback: string): string {
	const code = error?.code;
	const name = error?.name;
	const message = String(error?.message || '');

	if (isInfrastructureError(error)) {
		return 'Não foi possível ligar à base de dados. Tente novamente dentro de instantes.';
	}

	// Erros de validação/negócio conhecidos (lançados com throw new Error('...'))
	// não têm `code`/stack de Prisma — esses seguem para o cliente como estão.
	if (!code && !name?.startsWith('Prisma')) {
		return message || fallback;
	}

	return fallback;
}
