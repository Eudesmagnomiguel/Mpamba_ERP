import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatalogService } from '../../../src/services/module/billing/service.service.js';
import { prisma } from '../../../src/config/prisma.config.js';
import { organizationContext } from '../../../src/shared/utils/organization.context.js';

vi.mock('../../../src/config/prisma.config.js', () => ({
	prisma: {
		service: {
			create: vi.fn(),
			update: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
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

describe('CatalogService', () => {
	let service: CatalogService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new CatalogService();
	});

	describe('createService', () => {
		it('deve criar serviço com organizationId', async () => {
			const dto = { name: 'Manutenção', unitPrice: 500 };
			(prisma.service.create as any).mockResolvedValue({ id: 's1', ...dto });

			const result = await service.createService(dto as any);

			expect(result.id).toBe('s1');
			expect(prisma.service.create).toHaveBeenCalledWith({
				data: { ...dto, organizationId: 'org-1' }
			});
		});
	});

	describe('listServices', () => {
		it('deve listar serviços activos da organização', async () => {
			const mockServices = [{ id: 's1', name: 'S1', isActive: true }];
			(prisma.service.findMany as any).mockResolvedValue(mockServices);

			const result = await service.listServices();

			expect(result).toEqual(mockServices);
			expect(prisma.service.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.objectContaining({ organizationId: 'org-1', isActive: true })
			}));
		});
	});

	describe('getServiceById', () => {
		it('deve retornar serviço se existir', async () => {
			const mockService = { id: 's1', name: 'S1', organizationId: 'org-1' };
			(prisma.service.findFirst as any).mockResolvedValue(mockService);

			const result = await service.getServiceById('s1');
			expect(result).toEqual(mockService);
		});

		it('deve lançar erro se serviço não existir', async () => {
			(prisma.service.findFirst as any).mockResolvedValue(null);

			await expect(service.getServiceById('s-invalid')).rejects.toThrow('Serviço não encontrado');
		});
	});

	describe('deleteService', () => {
		it('deve desactivar serviço', async () => {
			(prisma.service.update as any).mockResolvedValue({ id: 's1', isActive: false });

			const result = await service.deleteService('s1');

			expect(result.isActive).toBe(false);
			expect(prisma.service.update).toHaveBeenCalledWith({
				where: { id: 's1', organizationId: 'org-1' },
				data: { isActive: false }
			});
		});
	});
});
