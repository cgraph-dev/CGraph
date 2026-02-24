/**
 * Auth Store Utilities
 *
 * Helper functions for the authentication store.
 *
 * @module modules/auth/store/authStore.utils
 */

import { AxiosError } from 'axios';
import type { ApiErrorResponse, User } from './authStore.types';
import type { StateStorage } from 'zustand/middleware';

/**
 * Extract error message from API errors
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined; // type assertion: axios error response data shape
    return data?.error || data?.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

/**
 * Map API user response to frontend User type
 *
 * Exported for use in OAuth callbacks
 */
export function mapUserFromApi(apiUser: Record<string, unknown>): User {
  return {
    id: apiUser.id as string, // type assertion: API field narrowed from unknown
    uid: (apiUser.uid as string) || '', // type assertion: API field narrowed from unknown
    userId: (apiUser.user_id as number) || 0, // type assertion: API field narrowed from unknown
    userIdDisplay: (apiUser.user_id_display as string) || '#0000000000', // type assertion: API field narrowed from unknown
    email: apiUser.email as string, // type assertion: API field narrowed from unknown
    username: (apiUser.username as string | null) || null, // type assertion: API field narrowed from unknown
    displayName: (apiUser.display_name as string | null) || null, // type assertion: API field narrowed from unknown
    avatarUrl: (apiUser.avatar_url as string | null) || null, // type assertion: API field narrowed from unknown
    walletAddress: (apiUser.wallet_address as string | null) || null, // type assertion: API field narrowed from unknown
    emailVerifiedAt: (apiUser.email_verified_at as string | null) || null, // type assertion: API field narrowed from unknown
    twoFactorEnabled: (apiUser.totp_enabled as boolean) || false, // type assertion: API field narrowed from unknown
    status: (apiUser.status as 'online' | 'idle' | 'dnd' | 'offline') || 'offline', // type assertion: API field narrowed to status union
    statusMessage: (apiUser.custom_status as string | null) || null, // type assertion: API field narrowed from unknown
    karma: (apiUser.karma as number) || 0, // type assertion: API field narrowed from unknown
    isVerified: (apiUser.is_verified as boolean) || false, // type assertion: API field narrowed from unknown
    isPremium: (apiUser.is_premium as boolean) || false, // type assertion: API field narrowed from unknown
    isAdmin: (apiUser.is_admin as boolean) || false, // type assertion: API field narrowed from unknown
    canChangeUsername: (apiUser.can_change_username as boolean) ?? true, // type assertion: API field narrowed from unknown
    usernameNextChangeAt: (apiUser.username_next_change_at as string | null) || null, // type assertion: API field narrowed from unknown
    createdAt: apiUser.inserted_at as string, // type assertion: API field narrowed from unknown
    // Gamification fields
    level: (apiUser.level as number) || 1, // type assertion: API field narrowed from unknown
    xp: (apiUser.xp as number) || 0, // type assertion: API field narrowed from unknown
    coins: (apiUser.coins as number) || 0, // type assertion: API field narrowed from unknown
    title: apiUser.title as string | undefined, // type assertion: API field narrowed from unknown
    titleColor: apiUser.title_color as string | undefined, // type assertion: API field narrowed from unknown
    badges: apiUser.badges as string[] | undefined, // type assertion: API field narrowed from unknown
    streak: (apiUser.streak as number) || 0, // type assertion: API field narrowed from unknown
  };
}

/**
 * Session storage wrapper for auth persistence
 *
 * SECURITY MODEL (XSS MITIGATION):
 * ================================
 *
 * 1. PRIMARY AUTH: HTTP-only cookies
 *    - Set by backend on login/register/refresh
 *    - Automatically sent with every request (withCredentials: true)
 *    - CANNOT be accessed by JavaScript (XSS immune)
 *    - This is the primary authentication mechanism
 *
 * 2. SECONDARY: Token in sessionStorage (WebSocket ONLY)
 *    - Phoenix Channels require token in connection params
 *    - HTTP-only cookies cannot be read by JS for WebSocket auth
 *    - This is a known limitation of WebSocket authentication
 *
 * MITIGATIONS:
 *    - sessionStorage (not localStorage): cleared on browser/tab close
 *    - Base64 encoding: provides obfuscation (not encryption)
 *    - Short-lived access tokens: expire in 15 minutes
 *    - Refresh tokens: sent via HTTP-only cookie path restriction
 *    - CORS + SameSite cookie settings prevent CSRF
 *    - Content Security Policy prevents inline script injection
 *
 * ATTACK SURFACE:
 *    - An XSS attack could steal the access token (15 min lifetime)
 *    - Cannot steal refresh token (HTTP-only cookie with path restriction)
 *    - User would need to re-login after access token expires
 *
 * FUTURE IMPROVEMENT:
 *    - Consider using a short-lived WebSocket-specific token
 *    - Implement token binding to prevent token theft reuse
 */
export const createSecureStorage = (): StateStorage => {
  const encode = (data: string): string => {
    try {
      return btoa(encodeURIComponent(data));
    } catch {
      return data;
    }
  };

  const decode = (data: string): string => {
    try {
      return decodeURIComponent(atob(data));
    } catch {
      return data;
    }
  };

  return {
    getItem: (name: string): string | null => {
      const value = sessionStorage.getItem(name);
      if (!value) return null;
      try {
        return decode(value);
      } catch {
        return value;
      }
    },
    setItem: (name: string, value: string): void => {
      sessionStorage.setItem(name, encode(value));
    },
    removeItem: (name: string): void => {
      sessionStorage.removeItem(name);
    },
  };
};
