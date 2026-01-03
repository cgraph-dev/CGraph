/**
 * OAuth Callback Handler
 * 
 * This page handles the OAuth callback from providers.
 * It can work in two modes:
 * 1. Popup mode - sends result back to opener window
 * 2. Redirect mode - stores result and redirects to app
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { handleOAuthCallback, OAuthProvider } from '@/lib/oauth';
import { useAuthStore } from '@/stores/authStore';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { provider } = useParams<{ provider: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    // Handle OAuth error
    if (error) {
      const message = errorDescription || 'Authorization was denied';
      setStatus('error');
      setErrorMessage(message);
      
      // Send error to opener if in popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'oauth_callback',
          error: message,
        }, window.location.origin);
        window.close();
      }
      return;
    }
    
    // Validate required params
    if (!code || !state || !provider) {
      setStatus('error');
      setErrorMessage('Missing authorization parameters');
      return;
    }
    
    // Validate provider
    const validProviders: OAuthProvider[] = ['google', 'apple', 'facebook', 'tiktok'];
    if (!validProviders.includes(provider as OAuthProvider)) {
      setStatus('error');
      setErrorMessage('Invalid OAuth provider');
      return;
    }
    
    // Verify state matches (CSRF protection)
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      setStatus('error');
      setErrorMessage('Invalid state parameter. Please try again.');
      return;
    }
    
    // Exchange code for tokens
    handleOAuthCallback(provider as OAuthProvider, code, state)
      .then((response) => {
        setStatus('success');
        
        // If opened as popup, send result to opener
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth_callback',
            response,
          }, window.location.origin);
          window.close();
        } else {
          // Redirect mode - update store and navigate
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
          
          // Clear stored OAuth data
          sessionStorage.removeItem('oauth_state');
          sessionStorage.removeItem('oauth_provider');
          
          // Navigate to app
          navigate('/', { replace: true });
        }
      })
      .catch((err) => {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Authentication failed');
        
        // Send error to opener if in popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth_callback',
            error: err.message || 'Authentication failed',
          }, window.location.origin);
          window.close();
        }
      });
  }, [searchParams, provider, navigate]);
  
  // Render loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
            Completing sign in...
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please wait while we verify your credentials
          </p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md px-4">
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            Authentication Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {errorMessage}
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }
  
  // Render success state (redirect mode only - popup will close)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
          Successfully signed in!
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Redirecting...
        </p>
      </div>
    </div>
  );
}

export default OAuthCallbackPage;
