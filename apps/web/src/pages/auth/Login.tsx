import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { OAuthButtonGroup, AuthDivider } from '@/components/auth/OAuthButtons';

export default function Login() {
  const navigate = useNavigate();
  const { login, getWalletChallenge, loginWithWallet, isLoading, error, clearError } = useAuthStore();

  // Auto-dismiss error after 1.5 seconds
  useEffect(() => {
    if (!error) return;
    
    const timer = setTimeout(() => {
      clearError();
    }, 1500);
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
    } catch (err) {
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
    <div className="space-y-8 animate-fadeIn">
      {/* Mobile Logo */}
      <div className="lg:hidden text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-white"
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
          <span className="text-2xl font-bold text-white">CGraph</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white">Welcome back</h2>
        <p className="mt-2 text-gray-400">Sign in to your account to continue</p>
      </div>

      {/* Error Alert with auto-dismiss */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm animate-fadeIn">
          {error}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
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
              className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded bg-dark-700 border-dark-600 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-400">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-600/30 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-dark-900 text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <OAuthButtonGroup
        providers={['google', 'apple', 'facebook', 'tiktok']}
        variant="icon"
        onSuccess={() => navigate('/messages')}
        onError={(err) => console.error('OAuth error:', err)}
      />

      {/* Wallet Login */}
      <button
        onClick={handleWalletConnect}
        disabled={isLoading}
        className="w-full py-3 px-4 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-3"
      >
        <svg className="h-5 w-5" viewBox="0 0 40 40" fill="none">
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
        Connect Wallet
      </button>

      {/* Sign Up Link */}
      <p className="text-center text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
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
