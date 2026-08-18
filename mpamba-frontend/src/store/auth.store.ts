import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthUser } from '@/shared/types/auth.types';

interface AuthState {
	user: AuthUser | null;
	accessToken: string | null;
	refreshToken: string | null;
	isAuthenticated: boolean;
	
	// Actions
	setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
	setAccessToken: (accessToken: string) => void;
	updateUser: (user: Partial<AuthUser>) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			accessToken: null,
			refreshToken: null,
			isAuthenticated: false,

			setAuth: (user, accessToken, refreshToken) =>
				set({
					user,
					accessToken,
					refreshToken,
					isAuthenticated: true
				}),

			setAccessToken: (accessToken) => set({ accessToken }),

			updateUser: (updatedUser) => 
				set((state) => ({
					user: state.user ? { ...state.user, ...updatedUser } : null
				})),

			logout: () => 
				set({ 
					user: null, 
					accessToken: null, 
					refreshToken: null, 
					isAuthenticated: false 
				}),
		}),
		{
			name: 'mpamba-auth-storage',
			storage: createJSONStorage(() => localStorage),
			// 🛡️ Persist all necessary state for session maintenance
			partialize: (state) => ({ 
				user: state.user, 
				accessToken: state.accessToken,
				refreshToken: state.refreshToken,
				isAuthenticated: state.isAuthenticated 
			}),
		}
	)
);
