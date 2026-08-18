import axios from "axios";
import ENV from "./env.utils";
import { useAuthStore } from "@/store/auth.store";

const apiClient = axios.create({
	baseURL: ENV.API_BASE_URL,
});

// Request Interceptor
apiClient.interceptors.request.use(
	(config) => {
		const token = useAuthStore.getState().accessToken;
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

function logoutAndRedirect() {
	useAuthStore.getState().logout();
	if (typeof window !== "undefined") {
		window.location.href = "/signin";
	}
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
	if (!refreshPromise) {
		refreshPromise = (async () => {
			const refreshToken = useAuthStore.getState().refreshToken;
			if (!refreshToken) {
				throw new Error("Sem refresh token disponível");
			}

			// Import tardio para evitar ciclo (auth.services importa apiClient)
			const { default: authService } = await import("@/services/core/auth.services");
			const { accessToken } = await authService.refresh({ refreshToken });
			useAuthStore.getState().setAccessToken(accessToken);
			return accessToken;
		})().finally(() => {
			refreshPromise = null;
		});
	}
	return refreshPromise;
}

// Response Interceptor for handling 401
apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && originalRequest) {
			const isAuthRequest =
				originalRequest.url?.includes("/auth/login") ||
				originalRequest.url?.includes("/auth/refresh");

			if (!isAuthRequest && !originalRequest._retry) {
				originalRequest._retry = true;
				try {
					const accessToken = await refreshAccessToken();
					originalRequest.headers.Authorization = `Bearer ${accessToken}`;
					return apiClient(originalRequest);
				} catch {
					logoutAndRedirect();
				}
			} else if (!isAuthRequest) {
				logoutAndRedirect();
			}
		}
		return Promise.reject(error);
	}
);

export default apiClient;