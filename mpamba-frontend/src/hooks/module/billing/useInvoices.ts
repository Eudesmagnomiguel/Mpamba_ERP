import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/module/billing/invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto, CancelInvoiceDto, MarkPaymentStatusDto } from '@/shared/dto/billing.dto';
import { invalidateBillingQueries } from './utils';

export const useBillingInvoices = (params?: any) => {
	return useQuery({
		queryKey: ['billing-invoices', params],
		queryFn: () => invoiceService.listInvoices(params),
	});
};

export const useBillingInvoice = (id: string) => {
	return useQuery({
		queryKey: ['billing-invoice', id],
		queryFn: () => invoiceService.getInvoiceById(id),
		enabled: !!id,
	});
};

export const useCreateBillingInvoice = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateInvoiceDto) => invoiceService.createInvoice(data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useIssueBillingInvoice = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => invoiceService.issueInvoice(id),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useCancelBillingInvoice = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: CancelInvoiceDto }) =>
			invoiceService.cancelInvoice(id, data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};

export const useMarkInvoicePaymentStatus = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: MarkPaymentStatusDto }) =>
			invoiceService.markPaymentStatus(id, data),
		onSuccess: () => invalidateBillingQueries(queryClient),
	});
};
