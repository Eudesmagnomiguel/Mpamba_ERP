import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { accountService } from '../../../services/module/treasury/account.service.js';
import { createAccountSchema } from '../../../shared/dto/treasury.dto.js';

export class AccountController {
	async createAccount(req: AuthRequest, res: Response) {
		try {
			const validation = createAccountSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const account = await accountService.createAccount(validation.data);
			res.status(201).json({ data: account });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getAccounts(req: AuthRequest, res: Response) {
		try {
			const accounts = await accountService.getAccounts();
			res.json({ data: accounts });
		} catch (error: any) {
			res.status(500).json({ message: error.message });
		}
	}

	async getAccountById(req: AuthRequest, res: Response) {
		try {
			const account = await accountService.getAccountById(req.params.id as string);
			res.json({ data: account });
		} catch (error: any) {
			res.status(404).json({ message: error.message });
		}
	}

	async updateAccount(req: AuthRequest, res: Response) {
		try {
			// Add validation later if needed, passing raw body for now like in the previous implementation
			const account = await accountService.updateAccount(req.params.id as string, req.body);
			res.json({ data: account });
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async deleteAccount(req: AuthRequest, res: Response) {
		try {
			await accountService.deleteAccount(req.params.id as string);
			res.status(204).send();
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	}

	async getBalance(req: AuthRequest, res: Response) {
		try {
			const balance = await accountService.getBalance(req.params.id as string);
			res.json({ data: { balance } });
		} catch (error: any) {
			res.status(404).json({ message: error.message });
		}
	}
}

export const accountController = new AccountController();
