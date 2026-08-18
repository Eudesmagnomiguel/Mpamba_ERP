import type { Request, Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { organizationService } from "../../services/module/organization.services.js";
import { createOrganizationSchema, updateOrganizationSchema, updateOwnOrganizationSchema } from "../../shared/dto/organization.dto.js";

export class OrganizationController {
	async getMine(req: AuthRequest, res: Response) {
		try {
			const organizationId = req.user?.organizationId;
			if (!organizationId) {
				return res.status(400).json({ error: "Utilizador não pertence a nenhuma organização" });
			}
			const organization = await organizationService.findById(organizationId);
			if (!organization) {
				return res.status(404).json({ error: "Organização não encontrada" });
			}
			res.json({ data: organization });
		} catch (error) {
			res.status(500).json({ error: "Erro ao buscar dados da organização" });
		}
	}

	async updateMine(req: AuthRequest, res: Response) {
		try {
			const organizationId = req.user?.organizationId;
			if (!organizationId) {
				return res.status(400).json({ error: "Utilizador não pertence a nenhuma organização" });
			}
			const data = updateOwnOrganizationSchema.parse(req.body);
			const organization = await organizationService.update(organizationId, data);
			res.json({ data: organization });
		} catch (error) {
			if (error instanceof Error && error.name === "ZodError") {
				return res.status(400).json({ error: "Dados inválidos", details: error });
			}
			res.status(500).json({ error: "Erro ao atualizar dados da organização" });
		}
	}
	async getAll(req: Request, res: Response) {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const pageSize = parseInt(req.query.pageSize as string) || 10;

			const result = await organizationService.findAll({ page, pageSize });
			res.json(result);
		} catch (error) {
			res.status(500).json({ error: "Erro ao buscar organizações" });
		}
	}

	async getById(req: Request, res: Response) {
		try {
			const id = req.params.id as string;
			if (!id) {
				return res.status(400).json({ error: "ID é obrigatório" });
			}
			const organization = await organizationService.findById(id);

			if (!organization) {
				return res.status(404).json({ error: "Organização não encontrada" });
			}

			res.json(organization);
		} catch (error) {
			res.status(500).json({ error: "Erro ao buscar organização" });
		}
	}

	async create(req: Request, res: Response) {
		try {
			const data = createOrganizationSchema.parse(req.body);
			const organization = await organizationService.create(data);

			res.status(201).json(organization);
		} catch (error) {
			if (error instanceof Error && error.name === "ZodError") {
				return res.status(400).json({ error: "Dados inválidos", details: error });
			}
			res.status(500).json({ error: "Erro ao criar organização" });
		}
	}

	async update(req: Request, res: Response) {
		try {
			const id = req.params.id as string;
			if (!id) {
				return res.status(400).json({ error: "ID é obrigatório" });
			}
			const data = updateOrganizationSchema.parse(req.body);

			const organization = await organizationService.update(id, data);

			res.json(organization);
		} catch (error) {
			if (error instanceof Error && error.name === "ZodError") {
				return res.status(400).json({ error: "Dados inválidos", details: error });
			}
			res.status(500).json({ error: "Erro ao atualizar organização" });
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const id = req.params.id as string;
			if (!id) {
				return res.status(400).json({ error: "ID é obrigatório" });
			}
			await organizationService.delete(id);

			res.status(204).send();
		} catch (error: any) {
			console.error('Error deleting organization:', error);
			const message = error.message || "Erro ao deletar organização";
			const statusCode = error.message?.includes('não encontrada') ? 404 :
				error.message?.includes('Não é possível') ? 400 : 500;
			res.status(statusCode).json({ error: message });
		}
	}

	async assignModule(req: Request, res: Response) {
		try {
			const id = req.params.id as string;
			const moduleId = req.params.moduleId as string;
			if (!id || !moduleId) {
				return res.status(400).json({ error: "ID e moduleId são obrigatórios" });
			}
			const result = await organizationService.assignModule(id, moduleId);

			res.status(201).json(result);
		} catch (error) {
			res.status(500).json({ error: "Erro ao atribuir módulo" });
		}
	}

	async removeModule(req: Request, res: Response) {
		try {
			const id = req.params.id as string;
			const moduleId = req.params.moduleId as string;
			if (!id || !moduleId) {
				return res.status(400).json({ error: "ID e moduleId são obrigatórios" });
			}
			await organizationService.removeModule(id, moduleId);

			res.status(204).send();
		} catch (error) {
			res.status(500).json({ error: "Erro ao remover módulo" });
		}
	}
}

export const organizationController = new OrganizationController();