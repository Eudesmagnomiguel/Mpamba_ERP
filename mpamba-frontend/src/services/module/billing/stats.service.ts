import apiClient from '@/shared/utils/api.utils';

export const statsService = {
	async getStats() {
		const response = await apiClient.get('/billing/stats');
		return response.data;
	},
};
