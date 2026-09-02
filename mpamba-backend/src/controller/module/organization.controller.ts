import type { Request, Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { organizationService, DuplicateNifError, PlanNotFoundError } from "../../services/module/organization.services.js";
import { createOrganizationSchema, updateOrganizationSchema, updateOwnOrganizationSchema, updateOrganizationLogoSchema } from "../../shared/dto/organization.dto.js";

/**
 * Traduz a excepção num par (estado HTTP, mensagem) que o frontend consegue
 * mostrar. Sem isto qualquer falha — incluindo NIF duplicado — chegava ao
 * utilizador como um 500 genérico "Erro ao criar organização".
 */
function respondWithOrganizationError(res: Response, error: any, fallback: string) {
	if (error?.name === "ZodError") {
		const issue = error.issues?.[0];
		const message = issue
			? `${issue.path?.join(".") || "Dados"}: ${issue.message}`
			: "Dados inválidos";
		return res.status(400).json({ error: message, message, details: error.issues });
	}

	if (error instanceof DuplicateNifError || error?.code === "P2002") {
		const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(", ") : error?.meta?.target;
		const message =
			error instanceof DuplicateNifError
				? error.message
				: `Já existe uma organização com o mesmo valor no campo ${target || "único"}.`;
		return res.status(409).json({ error: message, message });
	}

	if (error instanceof PlanNotFoundError) {
		return res.status(400).json({ error: error.message, message: error.message });
	}

	if (error?.code === "P2025") {
		const message = "Organização não encontrada";
		return res.status(404).json({ error: message, message });
	}

	console.error("[Organization]", fallback, error);
	return res.status(500).json({ error: fallback, message: fallback });
}

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
			respondWithOrganizationError(res, error, "Erro ao atualizar dados da organização");
		}
	}
	/**
	 * Guarda o logótipo da organização: um URL http(s) ou a imagem em data URI.
	 * A imagem fica na base de dados porque o alojamento serverless não tem
	 * disco persistente entre invocações.
	 */
	async updateMineLogo(req: AuthRequest, res: Response) {
		try {
			const organizationId = req.user?.organizationId;
			if (!organizationId) {
				return res.status(400).json({ error: "Utilizador não pertence a nenhuma organização" });
			}
			const { logo } = updateOrganizationLogoSchema.parse(req.body);
			const organization = await organizationService.update(organizationId, { logoUrl: logo });
			res.json({ data: { logoUrl: organization.logoUrl } });
		} catch (error) {
			if (error instanceof Error && error.name === "ZodError") {
				return res.status(400).json({ error: "Logótipo inválido", details: error });
			}
			res.status(500).json({ error: "Erro ao guardar o logótipo" });
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
			respondWithOrganizationError(res, error, "Erro ao criar organização");
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
			respondWithOrganizationError(res, error, "Erro ao atualizar organização");
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