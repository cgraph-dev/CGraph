/**
 * Registration form fields with password visibility toggles.
 *
 * @module pages/auth/register/RegisterFormFields
 */

import { motion } from 'framer-motion';
import { PasswordToggleButton } from './PasswordToggleButton';

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

interface RegisterFormFieldsProps {
  email: string;
  setEmail: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
  agreeToTerms: boolean;
  setAgreeToTerms: (v: boolean) => void;
  isLoading: boolean;
}

export function RegisterFormFields(props: RegisterFormFieldsProps) {
  const reduced = prefersReducedMotion();

  return (
    <>
      <motion.div variants={reduced ? {} : itemVariants}>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
          Email address
        </label>
        <motion.input
          id="email"
          type="email"
          value={props.email}
          onChange={(e) => props.setEmail(e.target.value)}
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
          value={props.username}
          onChange={(e) => props.setUsername(e.target.value)}
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
            type={props.showPassword ? 'text' : 'password'}
            value={props.password}
            onChange={(e) => props.setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="matrix-input w-full rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 pr-12 text-white placeholder-gray-500 transition-all duration-300 hover:border-dark-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder="••••••••"
            whileFocus={reduced ? {} : { scale: 1.01 }}
          />
          <PasswordToggleButton
            show={props.showPassword}
            onToggle={() => props.setShowPassword(!props.showPassword)}
          />
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
            type={props.showConfirmPassword ? 'text' : 'password'}
            value={props.confirmPassword}
            onChange={(e) => props.setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="matrix-input w-full rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 pr-12 text-white placeholder-gray-500 transition-all duration-300 hover:border-dark-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder="••••••••"
            whileFocus={reduced ? {} : { scale: 1.01 }}
          />
          <PasswordToggleButton
            show={props.showConfirmPassword}
            onToggle={() => props.setShowConfirmPassword(!props.showConfirmPassword)}
          />
        </div>
      </motion.div>

      <motion.label
        variants={reduced ? {} : itemVariants}
        className="group flex cursor-pointer items-start gap-3"
      >
        <input
          type="checkbox"
          checked={props.agreeToTerms}
          onChange={(e) => props.setAgreeToTerms(e.target.checked)}
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
        disabled={props.isLoading}
        variants={reduced ? {} : itemVariants}
        whileHover={
          reduced || props.isLoading
            ? {}
            : { scale: 1.02, boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }
        }
        whileTap={reduced || props.isLoading ? {} : { scale: 0.98 }}
        className="matrix-button flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {props.isLoading ? (
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
    </>
  );
}
