import type { Request, Response } from "express";
import { permissionService } from "../../services/core/permission.service.js";
import { createPermissionSchema } from "../../shared/dto/permission.dto.js";

export class PermissionController {
	async getAll(req: Request, res: Response) {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const pageSize = parseInt(req.query.pageSize as string) || 10;

			const result = await permissionService.findAll({ page, pageSize });
			res.json(result);
		} catch (error: any) {
			res.status(500).json({ message: error.message || 'Erro ao buscar permissões' });
		}
	}

	async getById(req: Request, res: Response) {
		const { id } = req.params;
		const permission = await permissionService.findById(id as string);
		if (!permission) return res.status(404).json({ message: "Permission not found" });
		res.json(permission);
	}

	async create(req: Request, res: Response) {
		const validation = createPermissionSchema.safeParse(req.body);
		if (!validation.success) {
			return res.status(400).json({ errors: validation.error.format() });
		}

		const permission = await permissionService.create(validation.data);
		res.status(201).json(permission);
	}

	async update(req: Request, res: Response) {
		const { id } = req.params;
		const validation = createPermissionSchema.safeParse(req.body);
		if (!validation.success) {
			return res.status(400).json({ errors: validation.error.format() });
		}

		try {
			const permission = await permissionService.update(id as string, validation.data);
			res.json(permission);
		} catch (error: any) {
			res.status(500).json({ message: error.message || 'Erro ao atualizar permissão' });
		}
	}
}

export const permissionController = new PermissionController();