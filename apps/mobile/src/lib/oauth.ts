/**
 * OAuth Authentication Service for React Native
 * 
 * Handles OAuth flows for Google, Apple, Facebook, and TikTok
 * Uses native SDKs for better user experience on mobile
 */

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Alert } from 'react-native';
import { api, API_URL } from './api';
import { storage } from './storage';

// Ensure web browser redirect is completed
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple' | 'facebook' | 'tiktok';

export interface OAuthConfig {
  google?: {
    webClientId: string;
    iosClientId?: string;
    androidClientId?: string;
  };
  apple?: {
    enabled: boolean;
  };
  facebook?: {
    appId: string;
  };
  tiktok?: {
    clientKey: string;
  };
}

export interface OAuthResult {
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
 * OAuth discovery documents for providers
 */
const discovery = {
  google: {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  },
  facebook: {
    authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
  },
  tiktok: {
    authorizationEndpoint: 'https://www.tiktok.com/v2/auth/authorize',
    tokenEndpoint: 'https://open.tiktokapis.com/v2/oauth/token/',
  },
};

/**
 * Get the redirect URI for OAuth
 */
function getRedirectUri(): string {
  // For Expo, use AuthSession's makeRedirectUri
  return AuthSession.makeRedirectUri({
    scheme: 'cgraph',
    path: 'oauth/callback',
  });
}

/**
 * Send OAuth token to backend for verification and JWT generation
 */
async function verifyWithBackend(
  provider: OAuthProvider,
  accessToken: string,
  idToken?: string
): Promise<OAuthResult> {
  const response = await api.post(`/api/v1/auth/oauth/${provider}/mobile`, {
    access_token: accessToken,
    id_token: idToken,
  });
  
  return response.data;
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(config: OAuthConfig['google']): Promise<OAuthResult> {
  if (!config?.webClientId) {
    throw new Error('Google OAuth not configured');
  }
  
  const clientId = Platform.select({
    ios: config.iosClientId || config.webClientId,
    android: config.androidClientId || config.webClientId,
    default: config.webClientId,
  });
  
  const redirectUri = getRedirectUri();
  
  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: ['openid', 'email', 'profile'],
    redirectUri,
  });
  
  const result = await request.promptAsync(discovery.google);
  
  if (result.type !== 'success') {
    if (result.type === 'cancel') {
      throw new Error('Sign in was cancelled');
    }
    throw new Error('Google sign in failed');
  }
  
  // Exchange code for token
  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: result.params.code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier || '',
      },
    },
    discovery.google
  );
  
  // Verify with our backend
  return verifyWithBackend(
    'google',
    tokenResponse.accessToken,
    tokenResponse.idToken
  );
}

/**
 * Sign in with Apple
 * Only available on iOS 13+
 */
export async function signInWithApple(): Promise<OAuthResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign In is only available on iOS');
  }
  
  const isAvailable = await AppleAuthentication.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Apple Sign In is not available on this device');
  }
  
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });
    
    if (!credential.identityToken) {
      throw new Error('No identity token received from Apple');
    }
    
    // Verify with our backend
    return verifyWithBackend(
      'apple',
      credential.authorizationCode || '',
      credential.identityToken
    );
  } catch (error: any) {
    if (error.code === 'ERR_CANCELED') {
      throw new Error('Sign in was cancelled');
    }
    throw error;
  }
}

/**
 * Sign in with Facebook
 */
export async function signInWithFacebook(config: OAuthConfig['facebook']): Promise<OAuthResult> {
  if (!config?.appId) {
    throw new Error('Facebook OAuth not configured');
  }
  
  const redirectUri = getRedirectUri();
  
  const request = new AuthSession.AuthRequest({
    clientId: config.appId,
    scopes: ['email', 'public_profile'],
    redirectUri,
    responseType: AuthSession.ResponseType.Token,
  });
  
  const result = await request.promptAsync(discovery.facebook);
  
  if (result.type !== 'success') {
    if (result.type === 'cancel') {
      throw new Error('Sign in was cancelled');
    }
    throw new Error('Facebook sign in failed');
  }
  
  const accessToken = result.params.access_token;
  if (!accessToken) {
    throw new Error('No access token received from Facebook');
  }
  
  // Verify with our backend
  return verifyWithBackend('facebook', accessToken);
}

/**
 * Sign in with TikTok
 */
export async function signInWithTikTok(config: OAuthConfig['tiktok']): Promise<OAuthResult> {
  if (!config?.clientKey) {
    throw new Error('TikTok OAuth not configured');
  }
  
  const redirectUri = getRedirectUri();
  
  const request = new AuthSession.AuthRequest({
    clientId: config.clientKey,
    scopes: ['user.info.basic'],
    redirectUri,
  });
  
  const result = await request.promptAsync(discovery.tiktok);
  
  if (result.type !== 'success') {
    if (result.type === 'cancel') {
      throw new Error('Sign in was cancelled');
    }
    throw new Error('TikTok sign in failed');
  }
  
  // TikTok returns a code, exchange for token with backend
  const code = result.params.code;
  if (!code) {
    throw new Error('No authorization code received from TikTok');
  }
  
  // Let backend handle the token exchange
  const response = await api.get(`/api/v1/auth/oauth/tiktok/callback`, {
    params: { code, state: result.params.state },
  });
  
  return response.data;
}

/**
 * Main OAuth sign in function
 * Routes to the appropriate provider
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
  config: OAuthConfig
): Promise<OAuthResult> {
  switch (provider) {
    case 'google':
      return signInWithGoogle(config.google);
    case 'apple':
      return signInWithApple();
    case 'facebook':
      return signInWithFacebook(config.facebook);
    case 'tiktok':
      return signInWithTikTok(config.tiktok);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Get list of available OAuth providers from backend
 */
export async function getAvailableProviders(): Promise<{ id: OAuthProvider; name: string; enabled: boolean }[]> {
  try {
    const response = await api.get('/api/v1/auth/oauth/providers');
    return response.data.providers;
  } catch {
    return [];
  }
}

/**
 * Provider display info
 */
export const providerInfo: Record<OAuthProvider, { name: string; color: string; textColor: string }> = {
  google: { name: 'Google', color: '#FFFFFF', textColor: '#000000' },
  apple: { name: 'Apple', color: '#000000', textColor: '#FFFFFF' },
  facebook: { name: 'Facebook', color: '#1877F2', textColor: '#FFFFFF' },
  tiktok: { name: 'TikTok', color: '#000000', textColor: '#FFFFFF' },
};
