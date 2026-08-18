import { AsyncLocalStorage } from 'node:async_hooks';

export interface OrganizationContextData {
	organizationId: string;
	userId: string;
	roles: string[];
}

const storage = new AsyncLocalStorage<OrganizationContextData>();

export const organizationContext = {
	run: (data: OrganizationContextData, callback: () => void) => {
		return storage.run(data, callback);
	},

	getStore: () => {
		return storage.getStore();
	},

	getOrganizationId: () => {
		return storage.getStore()?.organizationId;
	},

	getUserId: () => {
		return storage.getStore()?.userId;
	},

	getRoles: () => {
		return storage.getStore()?.roles || [];
	},

	isSuperAdmin: () => {
		const roles = storage.getStore()?.roles || [];
		return roles.includes('SUPER_ADMIN') || roles.includes('Super Administrador');
	}
};
