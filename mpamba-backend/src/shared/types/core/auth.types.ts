/**
 * JWT Access Token Payload
 */
export interface JwtPayload {
	sub: string;
	organizationId: string | null;
	roles: string[];
}

/**
 * JWT Refresh Token Payload
 */
export interface RefreshPayload {
	sub: string;
}

/**
 * Login Response Structure
 */
export interface LoginResponse {
	accessToken: string;
	refreshToken: string;
	user: AuthUser;
}

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

/**
 * Refresh Token Response
 */
export interface RefreshTokenResponse {
	accessToken: string;
}