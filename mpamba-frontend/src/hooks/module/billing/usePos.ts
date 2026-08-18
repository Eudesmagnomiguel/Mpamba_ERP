import { useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/module/billing/pos.service';
import { PosCheckoutDto } from '@/shared/dto/pos.dto';

export const usePosCheckout = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PosCheckoutDto) => posService.checkout(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['stock-products'] });
			queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
		},
	});
};
