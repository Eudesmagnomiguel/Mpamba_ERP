import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { accountingAccountService } from '../../../services/module/accounting/account.service.js';
import { createAccountSchema, updateAccountSchema } from '../../../shared/dto/accounting.dto.js';

export class AccountingAccountController {
	async list(req: AuthRequest, res: Response) {
		try {
			const accounts = await accountingAccountService.listAccounts();
			res.json({ data: accounts });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getById(req: AuthRequest, res: Response) {
		try {
			const account = await accountingAccountService.getAccountById(req.params.id as string);
			res.json({ data: account });
		} catch (error: any) {
			res.status(404).json({ message: error.message });
		}
	}

	async create(req: AuthRequest, res: Response) {
		try {
			const data = createAccountSchema.parse(req.body);
			const account = await accountingAccountService.createAccount(data);
			res.status(201).json({ data: account });
		} catch (error: any) {
			if (error.name === 'ZodError') return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
			res.status(400).json({ message: error.message });
		}
	}

	async update(req: AuthRequest, res: Response) {
		try {
			const data = updateAccountSchema.parse(req.body);
			const account = await accountingAccountService.updateAccount(req.params.id as string, data);
			res.json({ data: account });
		} catch (error: any) {
			if (error.name === 'ZodError') return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
			res.status(400).json({ message: error.message });
		}
	}

	async delete(req: AuthRequest, res: Response) {
		try {
			await accountingAccountService.deleteAccount(req.params.id as string);
			res.status(204).send();
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}
}

export const accountingAccountController = new AccountingAccountController();
