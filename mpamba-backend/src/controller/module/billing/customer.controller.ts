import type { Request, Response } from 'express';
import { customerService } from '../../../services/module/billing/customer.service.js';

export class CustomerController {
    async list(req: Request, res: Response) {
        try {
            const customers = await customerService.listCustomers(req.query);
            res.json({ data: customers });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const customer = await customerService.getCustomerById(req.params.id as string);
            res.json({ data: customer });
        } catch (error: any) {
            res.status(error.message.includes('não encontrado') ? 404 : 500).json({ message: error.message });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const customer = await customerService.createCustomer(req.body);
            res.status(201).json({ data: customer });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const customer = await customerService.updateCustomer(req.params.id as string, req.body);
            res.json({ data: customer });
        } catch (error: any) {
            res.status(error.message.includes('não encontrado') ? 404 : 400).json({ message: error.message });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            await customerService.deleteCustomer(req.params.id as string);
            res.status(204).send();
        } catch (error: any) {
            res.status(error.message.includes('não encontrado') ? 404 : 500).json({ message: error.message });
        }
    }
}

export const customerController = new CustomerController();
