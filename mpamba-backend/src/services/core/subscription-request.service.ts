import { prisma } from '../../config/prisma.config.js';
import { NotificationService } from './notification.service.js';
import { SubscriptionService } from './subscription.service.js';

export class SubscriptionRequestService {
    static async create(data: { organizationId: string; planId: string; type: 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE'; notes?: string; paymentReference?: string }) {
        if (!data.planId) throw new Error('O ID do plano é obrigatório para realizar o pedido.');
        if ((data.type === 'UPGRADE' || data.type === 'RENEWAL') && !data.paymentReference) {
            throw new Error('O código/referência da transferência é obrigatório para upgrade ou renovação.');
        }

        return prisma.subscriptionRequest.create({
            data: {
                organization: { connect: { id: data.organizationId } },
                plan: { connect: { id: data.planId } },
                type: data.type,
                notes: data.notes,
                paymentReference: data.paymentReference,
                status: 'PENDING'
            },
            include: {
                plan: true
            }
        });
    }

    static async list(params: { organizationId?: string; status?: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
        return prisma.subscriptionRequest.findMany({
            where: {
                organizationId: params.organizationId,
                status: params.status
            },
            include: {
                organization: {
                    select: { name: true, email: true }
                },
                plan: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async approve(requestId: string, adminResponse?: string) {
        const request = await prisma.subscriptionRequest.findUnique({
            where: { id: requestId },
            include: { organization: true, plan: true }
        });

        if (!request) throw new Error('Pedido não encontrado');
        if (request.status !== 'PENDING') throw new Error('Pedido já processado');

        // Aplica diretamente a mudança na subscrição — sem código de ativação intermédio
        if (request.type === 'UPGRADE' || request.type === 'DOWNGRADE') {
            await SubscriptionService.changeSubscriptionPlan(request.organizationId, request.planId);
        } else {
            await SubscriptionService.extendSubscription(request.organizationId, 1);
        }

        // Nota: changeSubscriptionPlan/extendSubscription já notificam a organização diretamente
        const updated = await prisma.subscriptionRequest.update({
            where: { id: requestId },
            data: {
                status: 'APPROVED',
                adminResponse
            }
        });

        return updated;
    }

    static async reject(requestId: string, adminResponse?: string) {
        const request = await prisma.subscriptionRequest.findUnique({ where: { id: requestId } });
        if (!request) throw new Error('Pedido não encontrado');

        const updated = await prisma.subscriptionRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                adminResponse
            }
        });

        await NotificationService.notifyOrganization(request.organizationId, {
            title: 'Pedido de subscrição rejeitado',
            message: adminResponse || 'O seu pedido de subscrição foi rejeitado.',
            type: 'WARNING'
        });

        return updated;
    }
}
