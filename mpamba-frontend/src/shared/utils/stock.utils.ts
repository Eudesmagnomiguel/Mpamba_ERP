export type ExpiryStatus = 'SEM_VALIDADE' | 'VALIDO' | 'A_EXPIRAR' | 'EXPIRADO';

/**
 * Dias de antecedência a partir dos quais um produto conta como «a expirar».
 *
 * Espelha `EXPIRY_WARNING_DAYS` do backend
 * (`src/services/module/stock/expiry.constants.ts`).
 */
export const EXPIRY_WARNING_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Dias de calendário que faltam até à validade: 0 é «expira hoje» e um número
 * negativo significa que já expirou.
 *
 * A validade é um dia, não um instante — a API devolve-a como meia-noite UTC —,
 * por isso a comparação usa os componentes UTC das duas datas.
 */
export function daysUntilExpiry(expiryDate: string | Date, reference: Date = new Date()): number {
	const expiry = new Date(expiryDate);
	const expiryDay = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());
	const today = Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate());
	return Math.round((expiryDay - today) / MS_PER_DAY);
}

/** Classifica a validade. Um produto expira no fim do dia da sua validade. */
export function expiryStatusOf(expiryDate: string | Date | null | undefined, reference: Date = new Date()): ExpiryStatus {
	if (!expiryDate) return 'SEM_VALIDADE';

	const days = daysUntilExpiry(expiryDate, reference);
	if (days < 0) return 'EXPIRADO';
	if (days <= EXPIRY_WARNING_DAYS) return 'A_EXPIRAR';
	return 'VALIDO';
}

/** Data de validade no formato `AAAA-MM-DD`, para um `<input type="date">`. */
export function toExpiryInputValue(expiryDate: string | Date | null | undefined): string {
	if (!expiryDate) return '';
	return new Date(expiryDate).toISOString().slice(0, 10);
}

/** Validade em pt-AO, ou um travessão quando o produto não expira. */
export function formatExpiryDate(expiryDate: string | Date | null | undefined): string {
	if (!expiryDate) return '—';
	return new Date(expiryDate).toLocaleDateString('pt-AO', { timeZone: 'UTC' });
}

/** Texto curto do estado da validade, para uma etiqueta na listagem. */
export function expiryStatusLabel(expiryDate: string | Date | null | undefined, reference: Date = new Date()): string {
	const status = expiryStatusOf(expiryDate, reference);
	if (status === 'SEM_VALIDADE') return 'Sem validade';
	if (status === 'VALIDO') return 'Válido';

	const days = daysUntilExpiry(expiryDate!, reference);
	if (days < 0) return `Expirou há ${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'}`;
	if (days === 0) return 'Expira hoje';
	return `Expira em ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

/** Classes da etiqueta de validade, alinhadas com as do estado de stock. */
export const EXPIRY_STATUS_CLASSES: Record<ExpiryStatus, string> = {
	SEM_VALIDADE: 'bg-slate-50 text-slate-500 border-slate-200',
	VALIDO: 'bg-emerald-50 text-emerald-600 border-emerald-100',
	A_EXPIRAR: 'bg-amber-50 text-amber-600 border-amber-100',
	EXPIRADO: 'bg-rose-50 text-rose-600 border-rose-100',
};
