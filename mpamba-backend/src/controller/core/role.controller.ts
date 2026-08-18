import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { roleService } from "../../services/core/role.service.js";
import { createRoleSchema, updateRoleSchema } from "../../shared/dto/role.dto.js";

export class RoleController {
	async getAll(req: AuthRequest, res: Response) {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const pageSize = parseInt(req.query.pageSize as string) || 10;

			const result = await roleService.findAll({ page, pageSize });
			res.json(result);
		} catch (error: any) {
			res.status(500).json({ message: error.message || 'Erro ao buscar perfis' });
		}
	}

	async getById(req: AuthRequest, res: Response) {
		try {
			const { id } = req.params;
			const role = await roleService.findById(id as string);
			if (!role) return res.status(404).json({ message: "Role not found" });
			res.json({ data: role });
		} catch (error: any) {
			res.status(400).json({ message: error.message || 'Erro ao buscar papel' });
		}
	}

	async getByModule(req: AuthRequest, res: Response) {
		try {
			const { moduleCode } = req.params;
			const page = parseInt(req.query.page as string) || 1;
			const pageSize = parseInt(req.query.pageSize as string) || 10;

			if (!moduleCode) {
				return res.status(400).json({ message: "Module code is required" });
			}

			const result = await roleService.findByModule(moduleCode as string, { page, pageSize });
			res.json(result);
		} catch (error: any) {
			res.status(500).json({ message: error.message || 'Erro ao buscar perfis do módulo' });
		}
	}

	async create(req: AuthRequest, res: Response) {
		try {
			const validation = createRoleSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const role = await roleService.create(validation.data);
			res.status(201).json({ data: role });
		} catch (error: any) {
			console.error('Error creating role:', error);
			const message = error.message || 'Erro ao criar perfil';
			const status = message.includes('Organization context required') ? 400 : 500;
			res.status(status).json({ message });
		}
	}

	async update(req: AuthRequest, res: Response) {
		try {
			const { id } = req.params;
			const validation = updateRoleSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const role = await roleService.update(id as string, validation.data);
			res.json(role);
		} catch (error: any) {
			console.error('Error updating role:', error);
			const message = error.message || 'Erro ao atualizar papel';
			const status = message.includes('não encontrado') ? 404 : 400;
			res.status(status).json({ message });
		}
	}

	async attachPermission(req: AuthRequest, res: Response) {
		try {
			const { id } = req.params;
			const { permissionId } = req.body;
			if (!permissionId) return res.status(400).json({ message: 'permissionId is required' });

			const result = await roleService.attachPermission(id as string, permissionId as string);
			res.status(201).json(result);
		} catch (error: any) {
			console.error('Error attaching permission to role:', error);
			res.status(400).json({ message: error.message || 'Erro ao associar permissão' });
		}
	}

	async detachPermission(req: AuthRequest, res: Response) {
		try {
			const { id, permissionId } = req.params;
			if (!permissionId) return res.status(400).json({ message: 'permissionId is required' });

			await roleService.detachPermission(id as string, permissionId as string);
			res.status(204).send();
		} catch (error: any) {
			console.error('Error detaching permission from role:', error);
			res.status(400).json({ message: error.message || 'Erro ao remover permissão' });
		}
	}

	async delete(req: AuthRequest, res: Response) {
		try {
			const { id } = req.params;
			await roleService.delete(id as string);
			res.status(204).send();
		} catch (error: any) {
			console.error('Error deleting role:', error);
			res.status(400).json({ message: error.message || 'Erro ao deletar papel' });
		}
	}
}

export const roleController = new RoleController();
