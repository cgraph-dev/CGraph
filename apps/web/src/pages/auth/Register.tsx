import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { OAuthButtonGroup } from '@/components/auth/OAuthButtons';
import { TextScramble, GlitchText, prefersReducedMotion } from '@/components/auth/AuthEffects';

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const reduced = prefersReducedMotion();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError || error;

  // Auto-dismiss error after 5 seconds (enough time to read)
  useEffect(() => {
    if (!displayError) return;

    const timer = setTimeout(() => {
      clearError();
      setLocalError(null);
    }, 5000);
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
    <motion.div
      className="space-y-8"
      variants={reduced ? {} : containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Mobile Logo with matrix glow */}
      <motion.div variants={reduced ? {} : itemVariants} className="text-center lg:hidden">
        <Link to="/" className="group inline-flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 transition-all duration-300 group-hover:bg-primary-500 group-hover:shadow-glow-md"
            whileHover={reduced ? {} : { scale: 1.1, rotate: 5 }}
            whileTap={reduced ? {} : { scale: 0.95 }}
          >
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
          </motion.div>
          <span className="matrix-glow text-2xl font-bold text-white">CGraph</span>
        </Link>
      </motion.div>

      {/* Header with cyberpunk text effect */}
      <motion.div variants={reduced ? {} : itemVariants} className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white">
          <GlitchText text="Create your account" className="matrix-glow" />
        </h2>
        <p className="mt-2 text-gray-400">
          <TextScramble text="Join the community and start connecting" delay={500} />
        </p>
      </motion.div>

      {/* Error Alert with matrix styling */}
      {displayError && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 shadow-lg shadow-red-500/10 backdrop-blur-sm"
        >
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
            {typeof displayError === 'string'
              ? displayError
              : (displayError as { message?: string })?.message || 'An error occurred'}
          </div>
        </motion.div>
      )}

      {/* Register Form with staggered animations */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div variants={reduced ? {} : itemVariants}>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
            Email address
          </label>
          <motion.input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="matrix-input w-full rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 text-white placeholder-gray-500 transition-all duration-300 hover:border-dark-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder="you@example.com"
            whileFocus={reduced ? {} : { scale: 1.01 }}
          />
        </motion.div>

        <motion.div variants={reduced ? {} : itemVariants}>
          <label htmlFor="username" className="mb-2 block text-sm font-medium text-gray-300">
            Username
          </label>
          <motion.input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            className="matrix-input w-full rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 text-white placeholder-gray-500 transition-all duration-300 hover:border-dark-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder="johndoe"
            whileFocus={reduced ? {} : { scale: 1.01 }}
          />
          <p className="mt-1 text-xs text-gray-500">
            Letters, numbers, and underscores only. 3-30 characters.
          </p>
        </motion.div>

        <motion.div variants={reduced ? {} : itemVariants}>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">
            Password
          </label>
          <div className="relative">
            <motion.input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="matrix-input w-full rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 pr-12 text-white placeholder-gray-500 transition-all duration-300 hover:border-dark-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="••••••••"
              whileFocus={reduced ? {} : { scale: 1.01 }}
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-all duration-200 hover:text-primary-400"
              whileHover={reduced ? {} : { scale: 1.2 }}
              whileTap={reduced ? {} : { scale: 0.9 }}
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
            </motion.button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
        </motion.div>

        <motion.div variants={reduced ? {} : itemVariants}>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-300">
            Confirm password
          </label>
          <div className="relative">
            <motion.input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="matrix-input w-full rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 pr-12 text-white placeholder-gray-500 transition-all duration-300 hover:border-dark-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="••••••••"
              whileFocus={reduced ? {} : { scale: 1.01 }}
            />
            <motion.button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-all duration-200 hover:text-primary-400"
              whileHover={reduced ? {} : { scale: 1.2 }}
              whileTap={reduced ? {} : { scale: 0.9 }}
            >
              {showConfirmPassword ? (
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
            </motion.button>
          </div>
        </motion.div>

        <motion.label
          variants={reduced ? {} : itemVariants}
          className="group flex cursor-pointer items-start gap-3"
        >
          <input
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-dark-600 bg-dark-700 text-primary-500 transition-all checked:border-primary-600 checked:bg-primary-600 focus:ring-primary-500/50 focus:ring-offset-0"
          />
          <span className="text-sm text-gray-400 transition-colors group-hover:text-gray-300">
            I agree to the{' '}
            <a
              href="https://cgraph.org/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="matrix-link"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="https://cgraph.org/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="matrix-link"
            >
              Privacy Policy
            </a>
          </span>
        </motion.label>

        <motion.button
          type="submit"
          disabled={isLoading}
          variants={reduced ? {} : itemVariants}
          whileHover={
            reduced || isLoading
              ? {}
              : { scale: 1.02, boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)' }
          }
          whileTap={reduced || isLoading ? {} : { scale: 0.98 }}
          className="matrix-button flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span className="animate-pulse">Creating account...</span>
            </>
          ) : (
            <>
              <span>Create account</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </>
          )}
        </motion.button>
      </form>

      {/* Divider with matrix styling */}
      <motion.div variants={reduced ? {} : itemVariants} className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-600/50" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-transparent px-4 text-gray-500 backdrop-blur-sm">
            Or sign up with
          </span>
        </div>
      </motion.div>

      {/* OAuth Buttons with matrix hover effects */}
      <motion.div variants={reduced ? {} : itemVariants}>
        <OAuthButtonGroup
          providers={['google', 'apple', 'facebook', 'tiktok']}
          variant="icon"
          onSuccess={() => navigate('/messages')}
          onError={(err) => console.error('OAuth error:', err)}
        />
      </motion.div>

      {/* Sign In Link with matrix styling */}
      <motion.p variants={reduced ? {} : itemVariants} className="text-center text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="matrix-link font-medium">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}
