/** Estado de validade de um produto. */
export type ExpiryStatus = 'SEM_VALIDADE' | 'VALIDO' | 'A_EXPIRAR' | 'EXPIRADO';

/** Dias de antecedência a partir dos quais um produto conta como «a expirar». */
export const EXPIRY_WARNING_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Dias de calendário que faltam até à validade: 0 é «expira hoje» e um número
 * negativo significa que já expirou.
 *
 * A validade é um dia, não um instante — o formulário envia `2026-09-30`, que
 * fica guardado como meia-noite UTC. A comparação é por isso feita sobre os
 * componentes UTC das duas datas, para que a hora do dia não desloque a contagem.
 */
export function daysUntilExpiry(expiryDate: Date, reference: Date = new Date()): number {
	const expiry = Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate());
	const today = Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate());
	return Math.round((expiry - today) / MS_PER_DAY);
}

/**
 * Classifica a validade de um produto. Um produto expira no fim do dia da sua
 * validade, pelo que só conta como expirado no dia seguinte.
 */
export function expiryStatusOf(expiryDate: Date | null | undefined, reference: Date = new Date()): ExpiryStatus {
	if (!expiryDate) return 'SEM_VALIDADE';

	const days = daysUntilExpiry(expiryDate, reference);
	if (days < 0) return 'EXPIRADO';
	if (days <= EXPIRY_WARNING_DAYS) return 'A_EXPIRAR';
	return 'VALIDO';
}

export const EXPIRY_STATUS_LABELS: Record<ExpiryStatus, string> = {
	SEM_VALIDADE: 'Sem validade',
	VALIDO: 'Válido',
	A_EXPIRAR: 'A expirar',
	EXPIRADO: 'Expirado',
};

/**
 * Limites de data que traduzem os estados de validade em filtros de consulta.
 * `expiredBefore` é a meia-noite UTC de hoje: uma validade anterior já passou.
 * `warningUntil` é o último dia ainda dentro da janela de aviso.
 */
export function expiryDateBounds(reference: Date = new Date()) {
	const today = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
	const warningUntil = new Date(today.getTime() + EXPIRY_WARNING_DAYS * MS_PER_DAY);
	return { expiredBefore: today, warningUntil };
}
