import { useMutation } from '@tanstack/react-query';
import authServices from '@/services/core/auth.services';
import { useAuthStore } from '@/store/auth.store';
import {
	SignInDTOType,
	RegisterDTOType,
	ActivateDTOType,
	ActivateWithCodeDto,
	ForgotPasswordDTOType,
	ResetPasswordDTOType,
	UpdateProfileDTOType
} from '@/shared/dto/auth.dto';

export const useLogin = () => {
	return useMutation({
		mutationFn: (data: SignInDTOType) => authServices.login(data),
	});
};

export const useRegister = () => {
	return useMutation({
		mutationFn: (data: RegisterDTOType) => authServices.register(data),
	});
};

export const useActivateOrganization = () => {
	return useMutation({
		mutationFn: (data: ActivateDTOType) => authServices.activate(data),
	});
};

export const useActivateWithCode = () => {
	return useMutation({
		mutationFn: (data: ActivateWithCodeDto) => authServices.activateWithCode(data),
	});
};

export const useLogout = () => {
	return useMutation({
		mutationFn: () => authServices.logout(),
	});
};

export const useApproveOrganization = () => {
	return useMutation({
		mutationFn: (id: string) => authServices.approve(id),
	});
};

export const useActivateDirectly = () => {
	return useMutation({
		mutationFn: (id: string) => authServices.activateDirectly(id),
	});
};

export const useForgotPassword = () => {
	return useMutation({
		mutationFn: (data: ForgotPasswordDTOType) => authServices.forgotPassword(data),
	});
};

export const useResetPassword = () => {
	return useMutation({
		mutationFn: (data: ResetPasswordDTOType) => authServices.resetPassword(data),
	});
};

export const useUpdateProfile = () => {
	const updateUser = useAuthStore((state) => state.updateUser);
	return useMutation({
		mutationFn: (data: UpdateProfileDTOType) => authServices.updateMe(data),
		onSuccess: (data) => {
			updateUser({ name: data.name, email: data.email, username: data.username });
		},
	});
};

export const useCompleteOnboarding = () => {
	return useMutation({
		mutationFn: () => authServices.completeOnboarding(),
	});
};
