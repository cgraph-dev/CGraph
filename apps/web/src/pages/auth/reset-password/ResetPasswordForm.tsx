/**
 * Reset Password Form Component
 *
 * Form for entering new password with strength validation.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { PasswordStrength } from './types';
import { containerVariants, itemVariants } from './utils';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { PasswordInput } from './PasswordInput';

interface ResetPasswordFormProps {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  strength: PasswordStrength;
  passwordsMatch: boolean;
  canSubmit: boolean;
  isLoading: boolean;
  errorMessage: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleShowPassword: () => void;
  onToggleShowConfirmPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ResetPasswordForm({
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  strength,
  passwordsMatch,
  canSubmit,
  isLoading,
  errorMessage,
  onPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
  onSubmit,
}: ResetPasswordFormProps) {
  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={onSubmit}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 text-white">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Create New Password</h2>
        <p className="mt-2 text-gray-400">Enter a strong password to secure your account</p>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Field */}
      <motion.div variants={itemVariants}>
        <PasswordInput
          label="New Password"
          value={password}
          onChange={onPasswordChange}
          placeholder="Enter new password"
          showPassword={showPassword}
          onToggleShow={onToggleShowPassword}
        />
        {password && <PasswordStrengthMeter strength={strength} />}
      </motion.div>

      {/* Confirm Password Field */}
      <motion.div variants={itemVariants}>
        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={onConfirmPasswordChange}
          placeholder="Confirm new password"
          showPassword={showConfirmPassword}
          onToggleShow={onToggleShowConfirmPassword}
          isValid={confirmPassword ? passwordsMatch : undefined}
          error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
        />
      </motion.div>

      {/* Submit Button */}
      <motion.div variants={itemVariants}>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Resetting Password...
            </>
          ) : (
            <>
              Reset Password
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </>
          )}
        </button>
      </motion.div>

      {/* Back to Login */}
      <motion.div variants={itemVariants} className="text-center">
        <Link
          to="/login"
          className="text-sm text-gray-400 transition-colors hover:text-primary-400"
        >
          Remember your password? Sign in
        </Link>
      </motion.div>
    </motion.form>
  );
}
