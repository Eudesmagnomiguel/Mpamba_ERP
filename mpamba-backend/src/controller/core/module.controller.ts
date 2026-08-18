import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma.config.js';

export class ModuleController {
	static async list(req: Request, res: Response) {
		try {
			const { page = 1, pageSize = 10 } = req.query;
			const skip = (Number(page) - 1) * Number(pageSize);
			const take = Number(pageSize);

			const [data, total] = await Promise.all([
				prisma.module.findMany({
					skip,
					take,
					orderBy: { name: 'asc' }
				}),
				prisma.module.count()
			]);

			return res.status(200).json({
				status: 'success',
				data,
				pagination: {
					total,
					page: Number(page),
					pageSize: Number(pageSize),
					totalPages: Math.ceil(total / take)
				}
			});
		} catch (error: any) {
			return res.status(500).json({ status: 'error', message: error.message });
		}
	}

	static async getById(req: Request, res: Response) {
		try {
			const id = req.params.id as string;
			const module = await prisma.module.findUnique({
				where: { id }
			});

			if (!module) {
				return res.status(404).json({ status: 'error', message: 'Módulo não encontrado' });
			}

			return res.status(200).json({ status: 'success', data: module });
		} catch (error: any) {
			return res.status(500).json({ status: 'error', message: error.message });
		}
	}

	static async create(req: Request, res: Response) {
		try {
			const { code, name, description } = req.body;

			const existingModule = await prisma.module.findUnique({ where: { code } });
			if (existingModule) {
				return res.status(400).json({ status: 'error', message: 'Módulo com este código já existe' });
			}

			const module = await prisma.module.create({
				data: { code, name, description }
			});

			return res.status(201).json({ status: 'success', data: module });
		} catch (error: any) {
			return res.status(500).json({ status: 'error', message: error.message });
		}
	}

	static async update(req: Request, res: Response) {
		try {
			const id = req.params.id as string;
			const { code, name, description } = req.body;

			const module = await prisma.module.update({
				where: { id },
				data: { code, name, description }
			});

			return res.status(200).json({ status: 'success', data: module });
		} catch (error: any) {
			return res.status(500).json({ status: 'error', message: error.message });
		}
	}

	static async delete(req: Request, res: Response) {
		try {
			const id = req.params.id as string;
			
			// Check if module is in use
			const inUse = await prisma.planModule.findFirst({ where: { moduleId: id } });
			if (inUse) {
				return res.status(400).json({ status: 'error', message: 'Não é possível excluir um módulo que está em uso por planos' });
			}

			await prisma.module.delete({ where: { id } });
			return res.status(204).send();
		} catch (error: any) {
			return res.status(500).json({ status: 'error', message: error.message });
		}
	}
}
