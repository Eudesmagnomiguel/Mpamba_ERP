import type { Request, Response } from 'express';
import { PlanService } from '../../services/core/plan.service.js';

export class PlanController {
	static async list(req: Request, res: Response) {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const pageSize = parseInt(req.query.pageSize as string) || 10;

			const result = await PlanService.listPlans({ page, pageSize });
			
			// Transform the data to match frontend expectations
			const transformedPlans = result.data.map((plan: any) => ({
				id: plan.id,
				code: plan.code,
				name: plan.name,
				description: plan.description,
				price: plan.price,
				interval: plan.interval,
				modules: (plan.modules || []).filter((pm: any) => pm.module).map((pm: any) => ({
					id: pm.module.id,
					code: pm.module.code,
					name: pm.module.name
				}))
			}));

			return res.json({ data: transformedPlans, pagination: result.pagination });
		} catch (error: any) {
			return res.status(500).json({ message: error.message || 'Erro ao listar planos' });
		}
	}

	static async getByCode(req: Request, res: Response) {
		try {
			const { code } = req.params;
			if (!code) {
				return res.status(400).json({ message: 'Código do plano é obrigatório' });
			}
			const plan = await PlanService.getPlanByCode(code as string);
			if (!plan) {
				return res.status(404).json({ message: 'Plano não encontrado' });
			}

			// Transform the data
			const transformedPlan = {
				id: plan.id,
				code: plan.code,
				name: plan.name,
				description: plan.description,
				price: plan.price,
				interval: plan.interval,
				modules: (plan.modules || []).filter((pm: any) => pm.module).map((pm: any) => ({
					id: pm.module.id,
					code: pm.module.code,
					name: pm.module.name
				}))
			};

			return res.json({ data: transformedPlan });
		} catch (error: any) {
			return res.status(500).json({ message: error.message || 'Erro ao buscar plano' });
		}
	}

	static async create(req: Request, res: Response) {
		try {
			const plan = await PlanService.createPlan(req.body);
			return res.status(201).json(plan);
		} catch (error: any) {
			return res.status(500).json({ message: error.message || 'Erro ao criar plano' });
		}
	}

	static async update(req: Request, res: Response) {
		try {
			const { id } = req.params;
			if (!id) {
				return res.status(400).json({ message: 'ID do plano é obrigatório' });
			}
			const plan = await PlanService.updatePlan(id as string, req.body);
			return res.json(plan);
		} catch (error: any) {
			return res.status(500).json({ message: error.message || 'Erro ao atualizar plano' });
		}
	}

	static async delete(req: Request, res: Response) {
		try {
			const { id } = req.params;
			if (!id) {
				return res.status(400).json({ message: 'ID do plano é obrigatório' });
			}
			await PlanService.deletePlan(id as string);
			return res.status(204).send();
		} catch (error: any) {
			return res.status(500).json({ message: error.message || 'Erro ao excluir plano' });
		}
	}
}