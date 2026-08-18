import { prisma } from "../../config/prisma.config.js";

export class OrganizationService {
	async findById(id: string) {
		return prisma.organization.findUnique({
			where: { id },
		});
	}

	async findByUser(userId: string) {
		return prisma.organization.findMany({
			where: {
				users: {
					some: {
						id: userId,
					},
				},
			},
		});
	}

	async update(id: string, data: any) {
		return prisma.organization.update({
			where: { id },
			data,
		});
	}
}

export const organizationService = new OrganizationService();