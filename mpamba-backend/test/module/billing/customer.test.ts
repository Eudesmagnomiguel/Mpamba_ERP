import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerService } from '../../../src/services/module/billing/customer.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { organizationContext } from '../../../src/shared/utils/organization.context.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		customer: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

vi.mock('../../../src/shared/utils/organization.context.js', () => ({
	organizationContext: {
		getOrganizationId: vi.fn().mockReturnValue('org-1'),
		getUserId: vi.fn().mockReturnValue('user-1'),
		isSuperAdmin: vi.fn().mockReturnValue(false),
		getStore: vi.fn(),
	},
}));

describe('CustomerService', () => {
	let service: CustomerService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new CustomerService();
	});

	describe('listCustomers', () => {
		it('deve listar clientes da organização', async () => {
			const mockCustomers = [{ id: 'c1', name: 'Cliente A' }];
			(prisma.customer.findMany as any).mockResolvedValue(mockCustomers);

			const result = await service.listCustomers();

			expect(result).toEqual(mockCustomers);
			expect(prisma.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.objectContaining({ organizationId: 'org-1' })
			}));
		});

		it('deve filtrar clientes por pesquisa', async () => {
			await service.listCustomers({ search: 'teste' });

			expect(prisma.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.objectContaining({
					OR: expect.arrayContaining([
						expect.objectContaining({ name: expect.any(Object) })
					])
				})
			}));
		});
	});

	describe('createCustomer', () => {
		it('deve criar cliente com organizationId', async () => {
			const dto = { name: 'Novo Cliente', nif: '123456789' };
			(prisma.customer.create as any).mockResolvedValue({ id: 'c-new', ...dto });

			const result = await service.createCustomer(dto);

			expect(result.id).toBe('c-new');
			expect(prisma.customer.create).toHaveBeenCalledWith({
				data: { ...dto, organizationId: 'org-1' }
			});
		});
	});

	describe('getCustomerById', () => {
		it('deve retornar cliente se existir', async () => {
			const mockCustomer = { id: 'c1', name: 'Cliente A', organizationId: 'org-1' };
			(prisma.customer.findFirst as any).mockResolvedValue(mockCustomer);

			const result = await service.getCustomerById('c1');
			expect(result).toEqual(mockCustomer);
		});

		it('deve lançar erro se cliente não existir', async () => {
			(prisma.customer.findFirst as any).mockResolvedValue(null);

			await expect(service.getCustomerById('c-invalid')).rejects.toThrow('Cliente não encontrado');
		});
	});

	describe('updateCustomer', () => {
		it('deve actualizar cliente com sucesso', async () => {
			(prisma.customer.findFirst as any).mockResolvedValue({ id: 'c1', organizationId: 'org-1' });
			(prisma.customer.update as any).mockResolvedValue({ id: 'c1', name: 'Nome Actualizado' });

			const result = await service.updateCustomer('c1', { name: 'Nome Actualizado' });

			expect(result.name).toBe('Nome Actualizado');
			expect(prisma.customer.update).toHaveBeenCalledWith({
				where: { id: 'c1' },
				data: { name: 'Nome Actualizado' }
			});
		});
	});

	describe('deleteCustomer', () => {
		it('deve eliminar cliente com sucesso', async () => {
			(prisma.customer.findFirst as any).mockResolvedValue({ id: 'c1', organizationId: 'org-1' });
			(prisma.customer.delete as any).mockResolvedValue({ id: 'c1' });

			await service.deleteCustomer('c1');

			expect(prisma.customer.delete).toHaveBeenCalledWith({
				where: { id: 'c1' }
			});
		});
	});
});
