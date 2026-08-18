import apiClient from '@/shared/utils/api.utils';
import { PosCheckoutDto, PosCheckoutResult } from '@/shared/dto/pos.dto';

export const posService = {
	async checkout(data: PosCheckoutDto) {
		const response = await apiClient.post<{ data: PosCheckoutResult }>('/billing/pos/checkout', data);
		return response.data.data;
	},
};
