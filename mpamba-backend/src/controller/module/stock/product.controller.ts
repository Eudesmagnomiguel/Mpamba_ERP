import type { Response } from 'express';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { productService } from '../../../services/module/stock/product.service.js';
import { createProductSchema, updateProductSchema } from '../../../shared/dto/stock.dto.js';
import type { InventoryReportRow } from '../../../services/module/stock/product.service.js';
import {
	buildWorkbook,
	fileDateSuffix,
	sendWorkbook,
	type ExcelColumn,
} from '../../../services/module/excel.service.js';
import { getReportOrganizationName } from '../../../shared/utils/report.utils.js';
import { toFriendlyErrorMessage } from '../../../shared/utils/db-error.utils.js';

export class ProductController {
	async getAllProducts(req: AuthRequest, res: Response) {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const pageSize = parseInt(req.query.pageSize as string) || 20;
			const search = req.query.search as string | undefined;
			const categoryId = req.query.categoryId as string | undefined;

			const result = await productService.findAllProducts({ page, pageSize, search, categoryId });
			res.json(result);
		} catch (error: any) {
			res.status(500).json({ message: error.message || 'Erro ao buscar produtos' });
		}
	}

	async getProductById(req: AuthRequest, res: Response) {
		try {
			const product = await productService.findProductById(req.params.id as string);
			res.json({ data: product });
		} catch (error: any) {
			const status = error.message.includes('não encontrado') ? 404 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async createProduct(req: AuthRequest, res: Response) {
		try {
			const validation = createProductSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const product = await productService.createProduct(validation.data);
			res.status(201).json({ data: product });
		} catch (error: any) {
			const status = error.message.includes('já está em uso') ? 409 
				: error.message.includes('não encontrada') ? 404 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async updateProduct(req: AuthRequest, res: Response) {
		try {
			const validation = updateProductSchema.safeParse(req.body);
			if (!validation.success) {
				return res.status(400).json({ errors: validation.error.format() });
			}

			const product = await productService.updateProduct(req.params.id as string, validation.data);
			res.json({ data: product });
		} catch (error: any) {
			const status = error.message.includes('não encontrado') ? 404 
				: error.message.includes('já está em uso') ? 409 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async deleteProduct(req: AuthRequest, res: Response) {
		try {
			await productService.deleteProduct(req.params.id as string);
			res.status(204).send();
		} catch (error: any) {
			const status = error.message.includes('não encontrado') ? 404 : 500;
			res.status(status).json({ message: error.message });
		}
	}

	async getMostUsedProducts(req: AuthRequest, res: Response) {
		try {
			const limit = parseInt(req.query.limit as string) || 5;
			const result = await productService.getMostUsedProducts(limit);
			res.json({ data: result });
		} catch (error: any) {
			res.status(500).json({ message: error.message || 'Erro ao buscar insights' });
		}
	}

	async getSummary(req: AuthRequest, res: Response) {
		try {
			const result = await productService.getStockSummary();
			res.json({ data: result });
		} catch (error: any) {
			res.status(500).json({ message: error.message || 'Erro ao buscar resumo' });
		}
	}

	async exportReport(req: AuthRequest, res: Response) {
		try {
			const csv = await productService.exportInventoryReport();
			const date = new Date().toISOString().slice(0, 10);
			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', `attachment; filename=relatorio-stock-${date}.csv`);
			res.send('﻿' + csv);
		} catch (error: any) {
			res.status(500).json({ message: error.message || 'Erro ao gerar relatório' });
		}
	}

	/** Relatório de inventário em .xlsx — GET /stock/report/export/excel */
	async exportReportExcel(req: AuthRequest, res: Response) {
		try {
			const [rows, organizationName] = await Promise.all([
				productService.getInventoryReportRows(),
				getReportOrganizationName(),
			]);

			const columns: ExcelColumn<InventoryReportRow>[] = [
				{ header: 'SKU', value: (r) => r.sku, width: 18 },
				{ header: 'Nome', value: (r) => r.name, width: 40 },
				{ header: 'Categoria', value: (r) => r.category, width: 24 },
				{ header: 'Unidade', value: (r) => r.unit, width: 12 },
				{ header: 'Quantidade Atual', value: (r) => r.currentQuantity, type: 'number', width: 18 },
				{ header: 'Stock Mínimo', value: (r) => r.minStock, type: 'number', width: 16 },
				{ header: 'Preço Unitário', value: (r) => r.price, type: 'currency', width: 18 },
				{ header: 'Valor em Stock', value: (r) => r.stockValue, type: 'currency', width: 20 },
				{ header: 'Validade', value: (r) => r.expiryDate, type: 'date', width: 14 },
				{ header: 'Estado da Validade', value: (r) => r.expiryStatus, width: 18 },
				{ header: 'Estado', value: (r) => r.status, width: 12 },
			];

			const buffer = await buildWorkbook(
				[
					{
						name: 'Inventário',
						title: `Relatório de Inventário${organizationName ? ` — ${organizationName}` : ''}`,
						subtitle: `Gerado a ${new Date().toLocaleDateString('pt-AO')}`,
						columns,
						rows,
						emptyMessage: 'Sem produtos registados.',
						totals: [
							{
								label: 'TOTAL',
								values: { 7: rows.reduce((sum, r) => sum + r.stockValue, 0) },
							},
						],
					},
				],
				{ organizationName }
			);

			sendWorkbook(res, buffer, `relatorio-stock-${fileDateSuffix()}`);
		} catch (error: any) {
			console.error('[Stock] Falha ao exportar inventário em Excel:', error);
			res.status(500).json({ message: toFriendlyErrorMessage(error, 'Erro ao gerar relatório em Excel') });
		}
	}
}

export const productController = new ProductController();
