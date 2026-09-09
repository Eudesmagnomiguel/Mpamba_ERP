/**
 * Ordena códigos de conta do PGC pela hierarquia e não como texto, para que
 * `75.2.9` venha antes de `75.2.11` e `68.9` antes de `68.10`.
 *
 * Espelha `compareAccountCodes` do backend
 * (`src/services/module/accounting/default-accounts.constants.ts`).
 */
export function compareAccountCodes(a: string, b: string): number {
	const left = a.split('.');
	const right = b.split('.');
	for (let i = 0; i < Math.max(left.length, right.length); i++) {
		const l = left[i];
		const r = right[i];
		if (l === undefined) return -1;
		if (r === undefined) return 1;
		const diff = Number(l) - Number(r);
		if (diff !== 0) return diff;
	}
	return 0;
}
