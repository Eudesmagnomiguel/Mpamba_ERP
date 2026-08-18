import { prisma } from '../../config/prisma.config.js';
import { organizationContext } from './organization.context.js';

/**
 * Nome da organização em contexto, para o cabeçalho dos relatórios exportados.
 *
 * Devolve `undefined` para Super Admins (que não têm organização) em vez de
 * rebentar — o relatório sai apenas sem o nome no topo.
 */
export async function getReportOrganizationName(): Promise<string | undefined> {
	const orgId = organizationContext.getOrganizationId();
	if (!orgId) return undefined;

	const organization = await prisma.organization.findUnique({
		where: { id: orgId },
		select: { name: true },
	});

	return organization?.name;
}

/**
 * Lê `startDate`/`endDate` da query string de um pedido.
 * Datas inválidas são tratadas como ausentes, para que um parâmetro mal
 * formado não produza um relatório com intervalo `Invalid Date`.
 */
export function parseDateRange(query: Record<string, unknown>): {
	startDate?: Date;
	endDate?: Date;
} {
	return {
		startDate: parseDate(query.startDate),
		endDate: parseDate(query.endDate),
	};
}

export function parseDate(value: unknown): Date | undefined {
	if (typeof value !== 'string' || value.trim().length === 0) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
}
