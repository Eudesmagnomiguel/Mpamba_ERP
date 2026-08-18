import apiClient from '@/shared/utils/api.utils';
import {
	CreateInvoiceDto,
	UpdateInvoiceDto,
	CancelInvoiceDto,
} from '@/shared/dto/billing.dto';
import {
	Invoice,
	BillingPaginatedResponse,
} from '@/shared/types/billing.types';

export const invoiceService = {
	async listInvoices(params?: any) {
		const response = await apiClient.get<BillingPaginatedResponse<Invoice>>('/billing/invoices', { params });
		return response.data;
	},

	async getInvoiceById(id: string) {
		const response = await apiClient.get<{ data: Invoice }>(`/billing/invoices/${id}`);
		return response.data.data;
	},

	async createInvoice(data: CreateInvoiceDto) {
		const response = await apiClient.post<{ data: Invoice }>('/billing/invoices', data);
		return response.data.data;
	},

	async updateInvoice(id: string, data: UpdateInvoiceDto) {
		const response = await apiClient.patch<{ data: Invoice }>(`/billing/invoices/${id}`, data);
		return response.data.data;
	},

	async issueInvoice(id: string) {
		const response = await apiClient.post<{ data: Invoice }>(`/billing/invoices/${id}/issue`);
		return response.data.data;
	},

	async cancelInvoice(id: string, data: CancelInvoiceDto) {
		const response = await apiClient.post<{ data: Invoice }>(`/billing/invoices/${id}/cancel`, data);
		return response.data.data;
	},

	async downloadInvoicePDF(id: string, format: 'A4' | 'THERMAL' = 'A4') {
		const response = await apiClient.get(`/billing/invoices/${id}/pdf`, { responseType: 'blob', params: { format } });
		return response.data;
	},

	async markPaymentStatus(id: string, data: any) {
		const response = await apiClient.patch<{ data: Invoice }>(`/billing/invoices/${id}/payment-status`, data);
		return response.data.data;
	},
};
