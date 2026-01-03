/**
 * OAuth authentication button components
 * Social login buttons for Google, Apple, Facebook, and TikTok
 */

import React, { useState } from 'react';
import { OAuthProvider, openOAuthPopup, providerColors, providerNames } from '@/lib/oauth';
import { useAuthStore } from '@/stores/authStore';

// SVG Icons for OAuth providers
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const providerIcons: Record<OAuthProvider, React.FC> = {
  google: GoogleIcon,
  apple: AppleIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
};

interface OAuthButtonProps {
  provider: OAuthProvider;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  variant?: 'full' | 'icon';
}

/**
 * Individual OAuth login button
 */
export function OAuthButton({
  provider,
  onSuccess,
  onError,
  className = '',
  variant = 'full',
}: OAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login: storeLogin } = useAuthStore();
  
  const colors = providerColors[provider];
  const Icon = providerIcons[provider];
  const name = providerNames[provider];
  
  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      const response = await openOAuthPopup(provider);
      
      // Update auth store with response
      useAuthStore.setState({
        user: {
          id: response.user.id,
          userId: 0,
          userIdDisplay: '#0000',
          email: response.user.email,
          username: response.user.username,
          displayName: response.user.display_name,
          avatarUrl: response.user.avatar_url,
          walletAddress: response.user.wallet_address,
          emailVerifiedAt: response.user.email_verified_at,
          twoFactorEnabled: response.user.totp_enabled,
          status: response.user.status,
          statusMessage: response.user.custom_status,
          karma: 0,
          isVerified: response.user.is_verified,
          isPremium: response.user.is_premium,
          isAdmin: false,
          canChangeUsername: true,
          usernameNextChangeAt: null,
          createdAt: response.user.inserted_at,
        },
        token: response.tokens.access_token,
        refreshToken: response.tokens.refresh_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      onSuccess?.();
    } catch (error) {
      console.error(`OAuth ${provider} error:`, error);
      onError?.(error instanceof Error ? error : new Error('OAuth failed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          p-3 rounded-full border transition-colors
          ${colors.bg} ${colors.text} ${colors.hover}
          disabled:opacity-50 disabled:cursor-not-allowed
          ${provider === 'google' ? 'border-gray-300' : 'border-transparent'}
          ${className}
        `}
        title={`Continue with ${name}`}
      >
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        ) : (
          <Icon />
        )}
      </button>
    );
  }
  
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg
        font-medium transition-colors border
        ${colors.bg} ${colors.text} ${colors.hover}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${provider === 'google' ? 'border-gray-300' : 'border-transparent'}
        ${className}
      `}
    >
      {isLoading ? (
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      ) : (
        <Icon />
      )}
      <span>Continue with {name}</span>
    </button>
  );
}

interface OAuthButtonGroupProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  providers?: OAuthProvider[];
  variant?: 'full' | 'icon';
  className?: string;
}

/**
 * Group of OAuth buttons
 */
export function OAuthButtonGroup({
  onSuccess,
  onError,
  providers = ['google', 'apple', 'facebook', 'tiktok'],
  variant = 'full',
  className = '',
}: OAuthButtonGroupProps) {
  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center gap-4 ${className}`}>
        {providers.map((provider) => (
          <OAuthButton
            key={provider}
            provider={provider}
            variant="icon"
            onSuccess={onSuccess}
            onError={onError}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {providers.map((provider) => (
        <OAuthButton
          key={provider}
          provider={provider}
          variant="full"
          onSuccess={onSuccess}
          onError={onError}
        />
      ))}
    </div>
  );
}

/**
 * Divider with "or" text for separating OAuth from email/password
 */
export function AuthDivider({ text = 'or continue with' }: { text?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300 dark:border-gray-600" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 text-gray-500 bg-white dark:bg-gray-900 dark:text-gray-400">
          {text}
        </span>
      </div>
    </div>
  );
}

export default OAuthButtonGroup;
