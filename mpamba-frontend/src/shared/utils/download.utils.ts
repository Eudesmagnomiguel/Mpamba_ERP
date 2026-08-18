import { getApiErrorMessage } from './api-error.utils';

/**
 * Dispara o download de um ficheiro recebido da API.
 *
 * O `revokeObjectURL` tem de acontecer depois de o browser processar o clique,
 * daí o adiamento — revogar de imediato cancela downloads no Firefox e Safari.
 */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.rel = 'noopener';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

/**
 * Mensagem de erro de um pedido feito com `responseType: 'blob'`.
 *
 * Nestes pedidos o axios entrega também o corpo de erro como Blob, pelo que
 * `error.response.data.message` vem sempre indefinido e a mensagem real do
 * backend seria perdida. Aqui o Blob é lido e interpretado como JSON antes de
 * cair no tratamento normal de erros.
 */
export async function getDownloadErrorMessage(error: any, fallback: string): Promise<string> {
	const data = error?.response?.data;

	if (data instanceof Blob) {
		try {
			const text = await data.text();
			const parsed = JSON.parse(text);
			if (typeof parsed?.message === 'string' && parsed.message.length > 0) {
				return parsed.message;
			}
		} catch {
			// Corpo não-JSON (ex.: uma página de erro HTML) — usa o tratamento normal.
		}
	}

	return getApiErrorMessage(error, fallback);
}

/** Sufixo de data usado nos nomes dos ficheiros: `relatorio-stock-2026-08-08`. */
export function fileDateSuffix(date: Date = new Date()): string {
	return date.toISOString().slice(0, 10);
}
