/**
 * Auth endpoints — login, register, token refresh, profile.
 */
import type { HttpHelpers, ApiResponse } from '../client';

export interface AuthUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
  readonly bio: string | null;
  readonly custom_status: string | null;
  readonly tier: string;
  readonly xp: number;
  readonly level: number;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface RegisterRequest {
  readonly username: string;
  readonly email: string;
  readonly password: string;
}

export interface TokenResponse {
  readonly token: string;
  readonly refresh_token: string;
  readonly user: AuthUser;
}

export interface AuthEndpoints {
  login(params: LoginRequest): Promise<ApiResponse<TokenResponse>>;
  register(params: RegisterRequest): Promise<ApiResponse<TokenResponse>>;
  refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refresh_token: string }>>;
  me(): Promise<ApiResponse<AuthUser>>;
  updateProfile(data: Partial<Pick<AuthUser, 'display_name' | 'bio' | 'custom_status'>>): Promise<ApiResponse<AuthUser>>;
  logout(): Promise<ApiResponse<void>>;
}

export function createAuthEndpoints(http: HttpHelpers): AuthEndpoints {
  return {
    login: (params) => http.post('/api/v1/auth/login', params),
    register: (params) => http.post('/api/v1/auth/register', params),
    refreshToken: (refreshToken) => http.post('/api/v1/auth/refresh', { refresh_token: refreshToken }),
    me: () => http.get('/api/v1/me'),
    updateProfile: (data) => http.patch('/api/v1/me', data),
    logout: () => http.post('/api/v1/auth/logout'),
  };
}
