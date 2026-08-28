/**
 * Traduz erros de chamadas à API (axios) para mensagens amigáveis em português.
 * Distingue falha de rede (sem resposta do servidor) de erros de negócio
 * devolvidos pelo backend, para nunca mostrar mensagens genéricas quando o
 * problema real é a falta de ligação à internet.
 */
export function getApiErrorMessage(error: any, fallback: string): string {
	const isNetworkError =
		!error?.response &&
		(error?.request ||
			error?.code === "ERR_NETWORK" ||
			error?.message === "Network Error");

	if (isNetworkError) {
		return "Sem conexão à internet. Verifique a sua rede e tente novamente.";
	}

	// Alguns endpoints devolvem `{ error }` em vez de `{ message }`; sem ler as
	// duas chaves, mensagens úteis (ex.: "NIF já registado") perdiam-se e o
	// utilizador via sempre o texto genérico.
	const data = error?.response?.data;
	return data?.message || data?.error || fallback;
}
