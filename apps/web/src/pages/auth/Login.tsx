import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { OAuthButtonGroup } from '@/components/auth/OAuthButtons';

export default function Login() {
  const navigate = useNavigate();
  const { login, getWalletChallenge, loginWithWallet, isLoading, error, clearError } =
    useAuthStore();

  // Auto-dismiss error after 5 seconds (enough time to read)
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      clearError();
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
      navigate('/messages');
    } catch {
      // Error is handled by store
    }
  };

  const handleWalletConnect = async () => {
    clearError();

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask to use wallet login');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const walletAddress = accounts[0];

      // Step 1: Get challenge message with nonce from backend
      const challenge = await getWalletChallenge(walletAddress);

      // Step 2: Sign the challenge message with MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [challenge.message, walletAddress],
      });

      // Step 3: Verify signature and login
      await loginWithWallet(walletAddress, signature);
      navigate('/messages');
    } catch (err) {
      // Error is handled by store or shown locally
      console.error('Wallet login error:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Mobile Logo with matrix glow */}
      <div className="form-field-animate text-center lg:hidden">
        <Link to="/" className="group inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 transition-all duration-300 group-hover:bg-primary-500 group-hover:shadow-glow-md">
            <svg
              className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <span className="matrix-glow text-2xl font-bold text-white">CGraph</span>
        </Link>
      </div>

      {/* Header with subtle animation */}
      <div className="form-field-animate text-center lg:text-left">
        <h2 className="matrix-glow text-3xl font-bold text-white">Welcome back</h2>
        <p className="mt-2 text-gray-400">Sign in to your account to continue</p>
      </div>

      {/* Error Alert with matrix styling */}
      {error && (
        <div className="animate-fade-in rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 shadow-lg shadow-red-500/10 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {/* Defensive rendering to prevent React error #31 when error is an object */}
            {typeof error === 'string'
              ? error
              : (error as { message?: string })?.message || 'An error occurred'}
          </div>
        </div>
      )}

      {/* Login Form with staggered animations */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-field-animate">
          <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-gray-300">
            Email or Username
          </label>
          <input
            id="identifier"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="matrix-input w-full rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder="you@example.com or username"
          />
        </div>

        <div className="form-field-animate">
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="matrix-input w-full rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-all duration-200 hover:scale-110 hover:text-primary-400"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="form-field-animate flex items-center justify-between">
          <label className="group flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-primary-500 transition-all checked:border-primary-600 checked:bg-primary-600 focus:ring-primary-500/50 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-400 transition-colors group-hover:text-gray-300">
              Remember me
            </span>
          </label>
          <Link to="/forgot-password" className="matrix-link text-sm">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="matrix-button form-field-animate flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span className="animate-pulse">Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Divider with matrix styling */}
      <div className="form-field-animate relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-600/50" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-transparent px-4 text-gray-500 backdrop-blur-sm">
            Or continue with
          </span>
        </div>
      </div>

      {/* OAuth Buttons with matrix hover effects */}
      <div className="form-field-animate">
        <OAuthButtonGroup
          providers={['google', 'apple', 'facebook', 'tiktok']}
          variant="icon"
          onSuccess={() => navigate('/messages')}
          onError={(err) => console.error('OAuth error:', err)}
        />
      </div>

      {/* Wallet Login with matrix styling */}
      <button
        onClick={handleWalletConnect}
        disabled={isLoading}
        className="form-field-animate group flex w-full items-center justify-center gap-3 rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 font-medium text-white transition-all duration-300 hover:border-primary-500/30 hover:bg-dark-700/80 hover:shadow-glow-sm"
      >
        <svg
          className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
          viewBox="0 0 40 40"
          fill="none"
        >
          <path
            d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z"
            fill="#627EEA"
          />
          <path d="M20.498 5V16.0875L29.995 20.2L20.498 5Z" fill="white" fillOpacity="0.602" />
          <path d="M20.498 5L11 20.2L20.498 16.0875V5Z" fill="white" />
          <path
            d="M20.498 27.4525V35.0025L30 21.815L20.498 27.4525Z"
            fill="white"
            fillOpacity="0.602"
          />
          <path d="M20.498 35.0025V27.4512L11 21.815L20.498 35.0025Z" fill="white" />
          <path
            d="M20.498 25.8363L29.995 20.2L20.498 16.09V25.8363Z"
            fill="white"
            fillOpacity="0.2"
          />
          <path d="M11 20.2L20.498 25.8363V16.09L11 20.2Z" fill="white" fillOpacity="0.602" />
        </svg>
        <span>Connect Wallet</span>
      </button>

      {/* Sign Up Link with matrix styling */}
      <p className="form-field-animate text-center text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="matrix-link font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}

// Type declaration for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}
