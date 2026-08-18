import type { Request, Response } from 'express';
import { SubscriptionRequestService } from '../../services/core/subscription-request.service.js';

export class SubscriptionRequestController {
    async create(req: Request, res: Response) {
        try {
            const organizationId = (req as any).user.organizationId;
            const { planId, type, notes, paymentReference } = req.body;

            const request = await SubscriptionRequestService.create({
                organizationId,
                planId,
                type,
                notes,
                paymentReference
            });

            return res.status(201).json({
                status: 'success',
                data: request
            });
        } catch (error: any) {
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async getMyRequests(req: Request, res: Response) {
        try {
            const organizationId = (req as any).user.organizationId;
            const requests = await SubscriptionRequestService.list({ organizationId });

            return res.json({
                status: 'success',
                data: requests
            });
        } catch (error: any) {
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async getAllRequests(req: Request, res: Response) {
        try {
            const status = req.query.status as any;
            const requests = await SubscriptionRequestService.list({ status });

            return res.json({
                status: 'success',
                data: requests
            });
        } catch (error: any) {
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async approve(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const adminResponse = req.body.adminResponse as string | undefined;

            const request = await SubscriptionRequestService.approve(id, adminResponse);

            return res.json({
                status: 'success',
                data: request
            });
        } catch (error: any) {
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async reject(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const adminResponse = req.body.adminResponse as string | undefined;

            const request = await SubscriptionRequestService.reject(id, adminResponse);

            return res.json({
                status: 'success',
                data: request
            });
        } catch (error: any) {
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

export const subscriptionRequestController = new SubscriptionRequestController();
