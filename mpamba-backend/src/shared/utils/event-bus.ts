import { EventEmitter } from 'events';

/**
 * Event Bus Central do Mpamba
 * Gerencia a comunicação assíncrona e desacoplada entre módulos.
 */
class EventBus extends EventEmitter {
	private static instance: EventBus;

	private constructor() {
		super();
		this.setMaxListeners(20); // Permitir múltiplos módulos reagindo ao mesmo evento
	}

	public static getInstance(): EventBus {
		if (!EventBus.instance) {
			EventBus.instance = new EventBus();
		}
		return EventBus.instance;
	}

	/**
	 * Emite um evento com tipagem e contexto
	 */
	emitEvent(eventName: string, payload: any) {
		console.log(`[EventBus] Emitting event: ${eventName}`, payload.id || '');
		this.emit(eventName, payload);
	}

	/**
	 * Subscreve a um evento
	 */
	subscribe(eventName: string, handler: (payload: any) => void) {
		this.on(eventName, handler);
	}
}

export const eventBus = EventBus.getInstance();

// Definição dos nomes dos eventos para evitar erros de escrita
export const EVENTS = {
	BILLING: {
		INVOICE_ISSUED: 'invoice.issued',
		INVOICE_CANCELLED: 'invoice.cancelled',
	},
	PROFORMA_CREATED: 'proforma.created',
	PROFORMA_CONVERTED: 'proforma.converted',
	CREDIT_NOTE_CREATED: 'credit-note.created',
	CREDIT_NOTE_ISSUED: 'credit-note.issued',  // Nota de crédito emitida → Saída na Tesouraria
	RECEIPT_CREATED: 'receipt.created',
	RECEIPT_ISSUED: 'receipt.issued',           // Recibo emitido → Entrada na Tesouraria
	STOCK: {
		STOCK_DECREASED: 'stock.decreased',     // Stock saiu → Pode gerar saída financeira
		STOCK_INCREASED: 'stock.increased',     // Stock entrou de fornecedor → Pode gerar despesa
	},
	TREASURY: {
		TRANSACTION_CREATED: 'transaction.created',
	}
} as const;
