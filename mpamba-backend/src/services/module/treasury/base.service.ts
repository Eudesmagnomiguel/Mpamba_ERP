import { organizationContext } from '../../../shared/utils/organization.context.js';

export abstract class BaseTreasuryService {
	protected get orgId(): string {
		const id = organizationContext.getOrganizationId();
		if (!id) throw new Error('Contexto de organização obrigatório para tesouraria');
		return id;
	}

	/**
	 * Como `orgId`, mas devolve `null` em vez de lançar quando não há organização
	 * no contexto (ex.: Super Admin). Usar em leituras/listagens que devem
	 * mostrar um estado vazio em vez de rebentar a página para quem não tem
	 * organização própria.
	 */
	protected get orgIdOrNull(): string | null {
		return organizationContext.getOrganizationId() || null;
	}

	protected get userId(): string {
		const id = organizationContext.getUserId();
		if (!id) throw new Error('Contexto de usuário obrigatório para tesouraria');
		return id;
	}
}
