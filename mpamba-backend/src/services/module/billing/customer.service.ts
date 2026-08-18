import { prisma } from '../../../config/prisma.config.js';
import { BaseBillingService } from './base.service.js';

export class CustomerService extends BaseBillingService {
    async listCustomers(params?: any) {
        return await prisma.customer.findMany({
            where: {
                organizationId: this.orgId,
                ...(params?.search && {
                    OR: [
                        { name: { contains: params.search, mode: 'insensitive' } },
                        { nif: { contains: params.search, mode: 'insensitive' } },
                        { email: { contains: params.search, mode: 'insensitive' } },
                    ]
                })
            },
            orderBy: { name: 'asc' }
        });
    }

    async getCustomerById(id: string) {
        const customer = await prisma.customer.findFirst({
            where: { id, organizationId: this.orgId }
        });

        if (!customer) throw new Error('Cliente não encontrado');
        return customer;
    }

    async createCustomer(data: any) {
        return await prisma.customer.create({
            data: {
                ...data,
                organizationId: this.orgId
            }
        });
    }

    async updateCustomer(id: string, data: any) {
        const customer = await this.getCustomerById(id);

        return await prisma.customer.update({
            where: { id: customer.id },
            data
        });
    }

    async deleteCustomer(id: string) {
        const customer = await this.getCustomerById(id);

        return await prisma.customer.delete({
            where: { id: customer.id }
        });
    }
}

export const customerService = new CustomerService();
