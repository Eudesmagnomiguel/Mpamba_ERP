import { eventBus, EVENTS } from '../../shared/utils/event-bus.js';
import { movementService } from './stock/movement.service.js';
import { movementService as treasuryMovementService } from './treasury/movement.service.js';
import { accountingPostingService } from './accounting/posting.service.js';
import { prisma } from '../../config/prisma.config.js';

/**
 * IntegrationService
 * Orquestra as reações automáticas entre módulos via EventBus.
 * 
 * Regra de ouro: cada handler verifica se o módulo-destino está ativo
 * na subscrição da organização antes de agir. Caso contrário, o módulo
 * de origem continua a funcionar de forma totalmente independente.
 */
export class IntegrationService {
	// Em serverless o init() corre a cada cold start. Sem esta guarda, uma
	// instância reaproveitada acumularia subscrições e o mesmo evento seria
	// processado mais de uma vez (ex.: baixar o stock duas vezes pela mesma fatura).
	private static initialized = false;

	public static init() {
		if (IntegrationService.initialized) return;
		IntegrationService.initialized = true;

		console.log('🔗 [Integration] Inicializando integração entre módulos...');

		// ─── FATURAÇÃO → STOCK ────────────────────────────────────────────────────
		// Quando uma fatura é emitida, baixar os produtos vendidos do stock
		eventBus.subscribe(EVENTS.BILLING.INVOICE_ISSUED, async (invoice) => {
			console.log(`📡 [Integration] Fatura emitida: ${invoice.number}`);
			const { SubscriptionService } = await import('../core/subscription.service.js');
			const orgId = invoice.organizationId;

			try {
				const isStockActive = await SubscriptionService.isModuleEnabled(orgId, 'stock');
				if (isStockActive) {
					await IntegrationService.handleStockReduction(invoice);
				} else {
					console.log(`⏭️ [Stock] Módulo inativo para org ${orgId} — ignorando baixa de stock`);
				}
			} catch (error) {
				console.error(`❌ [Integration] Erro ao processar invoice.issued:`, error);
			}

			try {
				const isAccountingActive = await SubscriptionService.isModuleEnabled(orgId, 'contabilidade');
				if (isAccountingActive) {
					await accountingPostingService.postInvoiceIssued(invoice);
				} else {
					console.log(`⏭️ [Accounting] Módulo inativo para org ${orgId} — ignorando lançamento contábil`);
				}
			} catch (error) {
				console.error(`❌ [Integration] Erro ao lançar contabilidade para invoice.issued:`, error);
			}
		});

		// ─── FATURAÇÃO → TESOURARIA (via RECIBO) ─────────────────────────────────
		// Quando um recibo é emitido (pagamento confirmado), registar entrada na tesouraria
		eventBus.subscribe(EVENTS.RECEIPT_ISSUED, async (payload: { receiptId: string; organizationId: string }) => {
			console.log(`📡 [Integration] Recibo emitido: ${payload.receiptId}`);
			const { SubscriptionService } = await import('../core/subscription.service.js');

			try {
				const isTreasuryActive = await SubscriptionService.isModuleEnabled(payload.organizationId, 'tesouraria');
				if (isTreasuryActive) {
					await IntegrationService.handleReceiptTreasuryEntry(payload.receiptId, payload.organizationId);
				} else {
					console.log(`⏭️ [Treasury] Módulo inativo para org ${payload.organizationId} — ignorando entrada financeira`);
				}
			} catch (error) {
				console.error(`❌ [Integration] Erro ao processar receipt.issued:`, error);
			}

			try {
				const isAccountingActive = await SubscriptionService.isModuleEnabled(payload.organizationId, 'contabilidade');
				if (isAccountingActive) {
					await IntegrationService.handleReceiptAccountingEntry(payload.receiptId, payload.organizationId);
				} else {
					console.log(`⏭️ [Accounting] Módulo inativo para org ${payload.organizationId} — ignorando lançamento contábil`);
				}
			} catch (error) {
				console.error(`❌ [Integration] Erro ao lançar contabilidade para receipt.issued:`, error);
			}
		});

		// ─── FATURAÇÃO → TESOURARIA (via NOTA DE CRÉDITO) ────────────────────────
		// Quando uma nota de crédito é emitida (reembolso/estorno), registar saída na tesouraria
		eventBus.subscribe(EVENTS.CREDIT_NOTE_ISSUED, async (payload: { creditNoteId: string; organizationId: string }) => {
			console.log(`📡 [Integration] Nota de crédito emitida: ${payload.creditNoteId}`);
			const { SubscriptionService } = await import('../core/subscription.service.js');

			try {
				const isTreasuryActive = await SubscriptionService.isModuleEnabled(payload.organizationId, 'tesouraria');
				if (isTreasuryActive) {
					await IntegrationService.handleCreditNoteTreasuryExit(payload.creditNoteId, payload.organizationId);
				} else {
					console.log(`⏭️ [Treasury] Módulo inativo para org ${payload.organizationId} — ignorando saída de crédito`);
				}
			} catch (error) {
				console.error(`❌ [Integration] Erro ao processar credit-note.issued:`, error);
			}

			try {
				const isAccountingActive = await SubscriptionService.isModuleEnabled(payload.organizationId, 'contabilidade');
				if (isAccountingActive) {
					await IntegrationService.handleCreditNoteAccountingEntry(payload.creditNoteId, payload.organizationId);
				} else {
					console.log(`⏭️ [Accounting] Módulo inativo para org ${payload.organizationId} — ignorando lançamento contábil`);
				}
			} catch (error) {
				console.error(`❌ [Integration] Erro ao lançar contabilidade para credit-note.issued:`, error);
			}
		});

		// ─── STOCK → TESOURARIA (Compra de fornecedor) ───────────────────────────
		// Quando stock entra de um fornecedor, sugerir registo de despesa na tesouraria
		// NOTA: Apenas emite um aviso/log. Não cria automaticamente a despesa
		// pois o valor da compra pode não estar disponível no movimento de stock.
		eventBus.subscribe(EVENTS.STOCK.STOCK_INCREASED, async (payload) => {
			if (!payload.supplierId) return; // Só interessa entradas de fornecedores
			const { SubscriptionService } = await import('../core/subscription.service.js');

			try {
				const isTreasuryActive = await SubscriptionService.isModuleEnabled(payload.organizationId, 'tesouraria');
				if (isTreasuryActive) {
					console.log(`💡 [Integration] Stock entrou de fornecedor (${payload.supplierId}) para produto ${payload.productName}. Considere registar a despesa na tesouraria.`);
					// TODO: Quando o AddStockDto incluir 'unitPrice', calcular o custo total
					// e criar automaticamente uma saída na tesouraria.
				}
			} catch (error) {
				console.error(`❌ [Integration] Erro ao processar stock.increased:`, error);
			}
		});

		// ─── FATURAÇÃO — Cancelamento ──────────────────────────────────────────────
		// Estorna automaticamente o stock baixado e a entrada financeira registada
		eventBus.subscribe(EVENTS.BILLING.INVOICE_CANCELLED, async (invoice) => {
			console.log(`📡 [Integration] Fatura cancelada: ${invoice.number}`);
			const { SubscriptionService } = await import('../core/subscription.service.js');
			const orgId = invoice.organizationId;

			try {
				const isStockActive = await SubscriptionService.isModuleEnabled(orgId, 'stock');
				if (isStockActive) {
					await IntegrationService.handleInvoiceCancelledStockReversal(invoice);
				} else {
					console.log(`⏭️ [Stock] Módulo inativo para org ${orgId} — ignorando estorno de stock`);
				}
			} catch (error) {
				console.error(`❌ [Integration] Erro ao estornar stock no cancelamento:`, error);
			}

			try {
				const isTreasuryActive = await SubscriptionService.isModuleEnabled(orgId, 'tesouraria');
				if (isTreasuryActive) {
					await IntegrationService.handleInvoiceCancelledTreasuryReversal(invoice, orgId);
				} else {
					console.log(`⏭️ [Treasury] Módulo inativo para org ${orgId} — ignorando estorno financeiro`);
				}
			} catch (error) {
				console.error(`❌ [Integration] Erro ao estornar tesouraria no cancelamento:`, error);
			}

			try {
				const isAccountingActive = await SubscriptionService.isModuleEnabled(orgId, 'contabilidade');
				if (isAccountingActive) {
					await accountingPostingService.postInvoiceCancelled(invoice);
				} else {
					console.log(`⏭️ [Accounting] Módulo inativo para org ${orgId} — ignorando estorno contábil`);
				}
			} catch (error) {
				console.error(`❌ [Integration] Erro ao estornar contabilidade no cancelamento:`, error);
			}
		});
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Handlers privados
	// ─────────────────────────────────────────────────────────────────────────────

	/**
	 * 📦 STOCK: Baixar inventário quando fatura é emitida
	 */
	private static async handleStockReduction(invoice: any) {
		for (const item of invoice.items) {
			if (!item.productId) continue;
			try {
				const existing = await prisma.stockMovement.findFirst({
					where: { productId: item.productId, reference: `INV:${invoice.number}` }
				});
				if (existing) {
					console.log(`⏭️ [Stock] Já processado para item ${item.productId}`);
					continue;
				}

				await movementService.removeStock(item.productId, {
					quantity: item.quantity,
					reference: `INV:${invoice.number}`,
					reason: `Venda automática — Fatura ${invoice.number}`
				});
				console.log(`✅ [Stock] Baixa: ${item.quantity}x produto ${item.productId}`);
			} catch (err: any) {
				console.warn(`⚠️ [Stock] Não foi possível baixar item ${item.productId}: ${err.message}`);
			}
		}
	}

	/**
	 * 💰 TESOURARIA: Registar entrada quando recibo é emitido (dinheiro recebido)
	 */
	private static async handleReceiptTreasuryEntry(receiptId: string, orgId: string) {
		const receipt = await prisma.receipt.findUnique({
			where: { id: receiptId },
			include: { invoice: true }
		});
		if (!receipt || receipt.status !== 'ISSUED') return;

		const account = await prisma.financialAccount.findFirst({
			where: { organizationId: orgId, isActive: true },
			orderBy: { type: 'desc' } // BANCO antes de CAIXA
		});
		if (!account) {
			console.warn(`⚠️ [Treasury] Nenhuma conta ativa para org ${orgId}`);
			return;
		}

		// Buscar ou criar categoria "Vendas"
		let category = await prisma.financialCategory.findFirst({
			where: { organizationId: orgId, name: 'Vendas', type: 'ENTRADA' }
		});
		if (!category) {
			category = await prisma.financialCategory.create({
				data: { name: 'Vendas', type: 'ENTRADA', organizationId: orgId }
			});
		}

		// Idempotência — evitar duplicados
		const existing = await prisma.financialMovement.findFirst({
			where: { accountId: account.id, reference: `REC:${receipt.number}` }
		});
		if (existing) {
			console.log(`⏭️ [Treasury] Movimento já processado para recibo ${receipt.number}`);
			return;
		}

		await treasuryMovementService.addIncome({
			accountId: account.id,
			amount: receipt.amount,
			categoryId: category.id,
			description: `Recebimento — Fatura ${receipt.invoice.number} (Recibo ${receipt.number})`,
			reference: `REC:${receipt.number}`
		});
		console.log(`✅ [Treasury] Entrada: ${receipt.amount} via Recibo ${receipt.number}`);
	}

	/**
	 * 💸 TESOURARIA: Registar saída quando nota de crédito é emitida (reembolso)
	 */
	private static async handleCreditNoteTreasuryExit(creditNoteId: string, orgId: string) {
		const creditNote = await prisma.creditNote.findUnique({
			where: { id: creditNoteId },
			include: { invoice: true }
		});
		if (!creditNote || creditNote.status !== 'ISSUED') return;

		const account = await prisma.financialAccount.findFirst({
			where: { organizationId: orgId, isActive: true },
			orderBy: { type: 'desc' }
		});
		if (!account) {
			console.warn(`⚠️ [Treasury] Nenhuma conta ativa para org ${orgId}`);
			return;
		}

		// Buscar ou criar categoria "Reembolsos"
		let category = await prisma.financialCategory.findFirst({
			where: { organizationId: orgId, name: 'Reembolsos', type: 'SAIDA' }
		});
		if (!category) {
			category = await prisma.financialCategory.create({
				data: { name: 'Reembolsos', type: 'SAIDA', organizationId: orgId }
			});
		}

		// Idempotência
		const existing = await prisma.financialMovement.findFirst({
			where: { accountId: account.id, reference: `NC:${creditNote.number}` }
		});
		if (existing) {
			console.log(`⏭️ [Treasury] Saída já processada para nota de crédito ${creditNote.number}`);
			return;
		}

		await treasuryMovementService.addExpense({
			accountId: account.id,
			amount: creditNote.amount,
			categoryId: category.id,
			description: `Reembolso — Nota de Crédito ${creditNote.number} (Fatura ${creditNote.invoice.number})`,
			reference: `NC:${creditNote.number}`
		});
		console.log(`✅ [Treasury] Saída (reembolso): ${creditNote.amount} via NC ${creditNote.number}`);
	}

	/**
	 * 📦 STOCK: Estornar as baixas de stock de uma fatura cancelada
	 */
	private static async handleInvoiceCancelledStockReversal(invoice: any) {
		const movements = await prisma.stockMovement.findMany({
			where: { reference: `INV:${invoice.number}` }
		});

		for (const movement of movements) {
			const alreadyReversed = await prisma.stockMovement.findFirst({
				where: { reference: `REVERSÃO: ${movement.id}` }
			});
			if (alreadyReversed) {
				console.log(`⏭️ [Stock] Estorno já processado para movimento ${movement.id}`);
				continue;
			}

			try {
				await movementService.reverseMovement(
					movement.id,
					`Estorno automático — Fatura ${invoice.number} cancelada`
				);
				console.log(`✅ [Stock] Estorno do movimento ${movement.id} (produto ${movement.productId})`);
			} catch (err: any) {
				console.warn(`⚠️ [Stock] Não foi possível estornar movimento ${movement.id}: ${err.message}`);
			}
		}
	}

	/**
	 * 💸 TESOURARIA: Estornar a entrada financeira de uma fatura cancelada
	 */
	private static async handleInvoiceCancelledTreasuryReversal(invoice: any, orgId: string) {
		const receipt = await prisma.receipt.findFirst({
			where: { invoiceId: invoice.id, status: 'ISSUED' }
		});
		if (!receipt) return;

		const account = await prisma.financialAccount.findFirst({
			where: { organizationId: orgId, isActive: true },
			orderBy: { type: 'desc' }
		});
		if (!account) {
			console.warn(`⚠️ [Treasury] Nenhuma conta ativa para org ${orgId}`);
			return;
		}

		// Buscar ou criar categoria "Estorno de Vendas"
		let category = await prisma.financialCategory.findFirst({
			where: { organizationId: orgId, name: 'Estorno de Vendas', type: 'SAIDA' }
		});
		if (!category) {
			category = await prisma.financialCategory.create({
				data: { name: 'Estorno de Vendas', type: 'SAIDA', organizationId: orgId }
			});
		}

		// Idempotência
		const existing = await prisma.financialMovement.findFirst({
			where: { accountId: account.id, reference: `INV-CANCEL:${invoice.number}` }
		});
		if (existing) {
			console.log(`⏭️ [Treasury] Estorno já processado para fatura ${invoice.number}`);
			return;
		}

		await treasuryMovementService.addExpense({
			accountId: account.id,
			amount: receipt.amount,
			categoryId: category.id,
			description: `Estorno — Fatura ${invoice.number} cancelada (Recibo ${receipt.number})`,
			reference: `INV-CANCEL:${invoice.number}`
		});
		console.log(`✅ [Treasury] Estorno: ${receipt.amount} referente à fatura cancelada ${invoice.number}`);
	}

	/**
	 * 📊 CONTABILIDADE: Lançar débito/crédito quando um recibo é emitido
	 */
	private static async handleReceiptAccountingEntry(receiptId: string, orgId: string) {
		const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } });
		if (!receipt || receipt.status !== 'ISSUED') return;

		const account = await prisma.financialAccount.findFirst({
			where: { organizationId: orgId, isActive: true },
			orderBy: { type: 'desc' }
		});
		const financialAccountType = account?.type === 'BANCO' ? 'BANCO' : 'CAIXA';

		await accountingPostingService.postReceiptIssued(
			{ id: receipt.id, number: receipt.number, organizationId: orgId, userId: receipt.userId, amount: receipt.amount },
			financialAccountType
		);
	}

	/**
	 * 📊 CONTABILIDADE: Lançar débito/crédito quando uma nota de crédito é emitida
	 */
	private static async handleCreditNoteAccountingEntry(creditNoteId: string, orgId: string) {
		const creditNote = await prisma.creditNote.findUnique({ where: { id: creditNoteId } });
		if (!creditNote || creditNote.status !== 'ISSUED') return;

		await accountingPostingService.postCreditNoteIssued({
			id: creditNote.id,
			number: creditNote.number,
			organizationId: orgId,
			userId: creditNote.userId,
			subtotal: creditNote.amount,
			taxTotal: 0
		});
	}
}
