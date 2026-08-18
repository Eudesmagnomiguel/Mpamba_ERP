import apiClient from "@/shared/utils/api.utils";
import {
	LoginDto,
	LoginResponse,
	RefreshTokenDto,
	RefreshTokenResponse,
	RegisterDto,
	RegisterResponse,
	ActivateDto,
	ActivateWithCodeDto,
	ForgotPasswordDTOType,
	ResetPasswordDTOType,
	UpdateProfileDTOType,
	UpdateProfileResponse
} from "@/shared/dto/auth.dto";
import { AuthUser } from "@/shared/types/auth.types";

class AuthService {
	
	async login(data: LoginDto): Promise<LoginResponse> {
		const response = await apiClient.post<{ data: LoginResponse }>("/auth/login", data);
		return response.data.data;
	}

	async register(data: RegisterDto): Promise<RegisterResponse> {
		const response = await apiClient.post<RegisterResponse>("/auth/register", data);
		return response.data;
	}

	async logout(): Promise<void> {
		await apiClient.post("/auth/logout");
	}

	async refresh(data: RefreshTokenDto): Promise<RefreshTokenResponse> {
		const response = await apiClient.post<{ data: RefreshTokenResponse }>("/auth/refresh", data);
		return response.data.data;
	}

	async me(): Promise<AuthUser> {
		const response = await apiClient.get<{ data: AuthUser }>("/auth/me");
		return response.data.data;
	}

	async updateMe(data: UpdateProfileDTOType): Promise<UpdateProfileResponse> {
		const response = await apiClient.put<{ data: UpdateProfileResponse }>("/auth/me", data);
		return response.data.data;
	}

	async activate(data: ActivateDto): Promise<{ message: string }> {
		const response = await apiClient.post<{ data: { message: string } }>("/auth/activate", data);
		return response.data.data;
	}

	async activateWithCode(data: ActivateWithCodeDto): Promise<{ message: string }> {
		const response = await apiClient.post<{ message: string }>("/auth/activate-with-code", data);
		return response.data;
	}

	async listPending(): Promise<any[]> {
		const response = await apiClient.get<{ data: any[] }>("/auth/pending");
		return response.data.data;
	}

	async approve(id: string): Promise<{ message: string }> {
		const response = await apiClient.post<{ data: { message: string } }>(`/auth/approve/${id}`);
		return response.data.data;
	}

	async activateDirectly(organizationId: string): Promise<{ message: string }> {
		const response = await apiClient.post<{ data: { message: string } }>(`/auth/activate-directly/${organizationId}`);
		return response.data.data;
	}

	async forgotPassword(data: ForgotPasswordDTOType): Promise<{ message: string }> {
		const response = await apiClient.post<{ data: { message: string } }>("/auth/forgot-password", data);
		return response.data.data;
	}

	async resetPassword(data: ResetPasswordDTOType): Promise<{ message: string }> {
		const response = await apiClient.post<{ data: { message: string } }>("/auth/reset-password", data);
		return response.data.data;
	}

	async completeOnboarding(): Promise<{ onboardingCompletedAt: string }> {
		const response = await apiClient.post<{ data: { onboardingCompletedAt: string } }>("/auth/onboarding/complete");
		return response.data.data;
	}
}

export default new AuthService();