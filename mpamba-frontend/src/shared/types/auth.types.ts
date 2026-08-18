/**
 * Authenticated User Information
 */
export interface AuthUser {
	id: string;
	name: string;
	email: string;
	username?: string | null;
	role: string;
	permissions: string[];
	modules: string[];
	organizationId: string | null;
	organization?: {
		id: string;
		name: string;
		nif?: string | null;
	} | null;
	onboardingCompletedAt: string | null;
}
