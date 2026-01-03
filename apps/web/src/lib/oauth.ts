/**
 * OAuth authentication service for web
 * Handles Google, Apple, Facebook, and TikTok OAuth flows
 */

import { api } from './api';

export type OAuthProvider = 'google' | 'apple' | 'facebook' | 'tiktok';

export interface OAuthProviderInfo {
  id: OAuthProvider;
  name: string;
  enabled: boolean;
}

export interface OAuthAuthorizationResponse {
  authorization_url: string;
  state: string;
  provider: string;
}

export interface OAuthTokenResponse {
  user: {
    id: string;
    email: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    wallet_address: string | null;
    email_verified_at: string | null;
    totp_enabled: boolean;
    status: 'online' | 'idle' | 'dnd' | 'offline';
    custom_status: string | null;
    is_verified: boolean;
    is_premium: boolean;
    inserted_at: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

/**
 * Get list of configured OAuth providers
 */
export async function getOAuthProviders(): Promise<OAuthProviderInfo[]> {
  const response = await api.get<{ providers: OAuthProviderInfo[] }>('/api/v1/auth/oauth/providers');
  return response.data.providers;
}

/**
 * Start OAuth flow - returns authorization URL to redirect to
 */
export async function startOAuthFlow(provider: OAuthProvider): Promise<OAuthAuthorizationResponse> {
  const response = await api.get<OAuthAuthorizationResponse>(`/api/v1/auth/oauth/${provider}`);
  return response.data;
}

/**
 * Handle OAuth callback (for popup flow)
 * The callback URL will include code and state parameters
 */
export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string,
  state: string
): Promise<OAuthTokenResponse> {
  const response = await api.get<OAuthTokenResponse>(
    `/api/v1/auth/oauth/${provider}/callback`,
    { params: { code, state } }
  );
  return response.data;
}

/**
 * Link OAuth account to current user
 */
export async function linkOAuthAccount(
  provider: OAuthProvider,
  accessToken: string,
  idToken?: string
): Promise<{ message: string; user: OAuthTokenResponse['user'] }> {
  const response = await api.post(`/api/v1/auth/oauth/${provider}/link`, {
    access_token: accessToken,
    id_token: idToken,
  });
  return response.data;
}

/**
 * Unlink OAuth account from current user
 */
export async function unlinkOAuthAccount(provider: OAuthProvider): Promise<{ message: string }> {
  const response = await api.delete(`/api/v1/auth/oauth/${provider}/link`);
  return response.data;
}

/**
 * Open OAuth popup window
 * Returns a promise that resolves with the auth response
 */
export function openOAuthPopup(provider: OAuthProvider): Promise<OAuthTokenResponse> {
  return new Promise((resolve, reject) => {
    // Get authorization URL
    startOAuthFlow(provider)
      .then(({ authorization_url, state }) => {
        // Store state for verification
        sessionStorage.setItem('oauth_state', state);
        sessionStorage.setItem('oauth_provider', provider);
        
        // Calculate popup position (center of screen)
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        // Open popup
        const popup = window.open(
          authorization_url,
          `oauth_${provider}`,
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
        );
        
        if (!popup) {
          reject(new Error('Popup blocked. Please allow popups for this site.'));
          return;
        }
        
        // Listen for OAuth callback message from popup
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'oauth_callback') {
            window.removeEventListener('message', handleMessage);
            clearInterval(checkClosed);
            
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.response);
            }
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Check if popup was closed without completing
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            reject(new Error('OAuth popup was closed'));
          }
        }, 500);
      })
      .catch(reject);
  });
}

/**
 * Provider display names
 */
export const providerNames: Record<OAuthProvider, string> = {
  google: 'Google',
  apple: 'Apple',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

/**
 * Provider icons (for styling reference)
 */
export const providerColors: Record<OAuthProvider, { bg: string; text: string; hover: string }> = {
  google: {
    bg: 'bg-white',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-100',
  },
  apple: {
    bg: 'bg-black',
    text: 'text-white',
    hover: 'hover:bg-gray-900',
  },
  facebook: {
    bg: 'bg-[#1877F2]',
    text: 'text-white',
    hover: 'hover:bg-[#166FE5]',
  },
  tiktok: {
    bg: 'bg-black',
    text: 'text-white',
    hover: 'hover:bg-gray-900',
  },
};
