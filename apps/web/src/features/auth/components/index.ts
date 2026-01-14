/**
 * Auth Components
 * 
 * Re-exports authentication-related components.
 */

// OAuth buttons - available from OAuthButtons.tsx
// Note: Individual provider buttons are created via OAuthButton component with provider prop
// export { default as GoogleOAuthButton } from '@/components/auth/GoogleOAuthButton';
// export { default as AppleOAuthButton } from '@/components/auth/AppleOAuthButton';
// export { default as GitHubOAuthButton } from '@/components/auth/GitHubOAuthButton';

// Wallet auth components - TODO: Create component
// export { default as WalletConnectButton } from '@/components/WalletConnectButton';

// 2FA components - TODO: Create component
// export { default as TwoFactorSetup } from '@/components/TwoFactorSetup';

// Available exports
export { default as OAuthButtonGroup, OAuthButton, AuthDivider } from '@/components/auth/OAuthButtons';
