import { organizationContext } from '../../../shared/utils/organization.context.js';

export abstract class BaseAccountingService {
	protected get orgId(): string {
		const id = organizationContext.getOrganizationId();
		if (!id) throw new Error('Contexto de organização obrigatório para contabilidade');
		return id;
	}

	protected get userId(): string {
		const id = organizationContext.getUserId();
		if (!id) throw new Error('Contexto de usuário obrigatório para contabilidade');
		return id;
	}
}
