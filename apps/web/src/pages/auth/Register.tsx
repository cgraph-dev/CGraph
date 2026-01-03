import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { OAuthButtonGroup } from '@/components/auth/OAuthButtons';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError || error;

  // Auto-dismiss error after 1.5 seconds
  useEffect(() => {
    if (!displayError) return;
    
    const timer = setTimeout(() => {
      clearError();
      setLocalError(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [displayError, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    // Validation
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (!agreeToTerms) {
      setLocalError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    try {
      await register(email, username, password);
      navigate('/messages');
    } catch {
      // Error is handled by store
    }
  };

  return (
    <div className="space-y-8">
      {/* Mobile Logo with matrix glow */}
      <div className="lg:hidden text-center form-field-animate">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-lg bg-primary-600 flex items-center justify-center
                        transition-all duration-300 group-hover:shadow-glow-md group-hover:bg-primary-500">
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
          <span className="text-2xl font-bold text-white matrix-glow">CGraph</span>
        </Link>
      </div>

      {/* Header with matrix styling */}
      <div className="text-center lg:text-left form-field-animate">
        <h2 className="text-3xl font-bold text-white matrix-glow">Create your account</h2>
        <p className="mt-2 text-gray-400">Join the community and start connecting</p>
      </div>

      {/* Error Alert with matrix styling */}
      {displayError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm 
                      animate-fade-in backdrop-blur-sm shadow-lg shadow-red-500/10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {displayError}
          </div>
        </div>
      )}

      {/* Register Form with staggered animations */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="form-field-animate">
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
            className="w-full px-4 py-3 bg-dark-800/80 border border-dark-600 rounded-lg text-white 
                     placeholder-gray-500 matrix-input focus:outline-none focus:ring-2 
                     focus:ring-primary-500/50 focus:border-primary-500/50"
            placeholder="you@example.com"
          />
        </div>

        <div className="form-field-animate">
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            className="w-full px-4 py-3 bg-dark-800/80 border border-dark-600 rounded-lg text-white 
                     placeholder-gray-500 matrix-input focus:outline-none focus:ring-2 
                     focus:ring-primary-500/50 focus:border-primary-500/50"
            placeholder="johndoe"
          />
          <p className="mt-1 text-xs text-gray-500">
            Letters, numbers, and underscores only. 3-30 characters.
          </p>
        </div>

        <div className="form-field-animate">
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
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-dark-800/80 border border-dark-600 rounded-lg text-white 
                       placeholder-gray-500 matrix-input focus:outline-none focus:ring-2 
                       focus:ring-primary-500/50 focus:border-primary-500/50 pr-12"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-400 
                       transition-all duration-200 hover:scale-110"
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
          <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
        </div>

        <div className="form-field-animate">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-dark-800/80 border border-dark-600 rounded-lg text-white 
                     placeholder-gray-500 matrix-input focus:outline-none focus:ring-2 
                     focus:ring-primary-500/50 focus:border-primary-500/50"
            placeholder="••••••••"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer group form-field-animate">
          <input
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded bg-dark-700 border-dark-600 text-primary-500 
                     focus:ring-primary-500/50 focus:ring-offset-0 transition-all
                     checked:bg-primary-600 checked:border-primary-600"
          />
          <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
            I agree to the{' '}
            <a href="#" className="matrix-link">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="matrix-link">
              Privacy Policy
            </a>
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 matrix-button disabled:opacity-50 disabled:cursor-not-allowed 
                   text-white font-medium rounded-lg flex items-center justify-center gap-2 form-field-animate"
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span className="animate-pulse">Creating account...</span>
            </>
          ) : (
            <>
              <span>Create account</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Divider with matrix styling */}
      <div className="relative form-field-animate">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-600/50" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-transparent text-gray-500 backdrop-blur-sm">Or sign up with</span>
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

      {/* Sign In Link with matrix styling */}
      <p className="text-center text-gray-400 form-field-animate">
        Already have an account?{' '}
        <Link to="/login" className="matrix-link font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
