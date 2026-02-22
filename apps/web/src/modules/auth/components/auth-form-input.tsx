/**
 * AuthFormInput Component
 *
 * Enhanced form input with animations, validation, and icons.
 * Features:
 * - Floating labels
 * - Validation states
 * - Password visibility toggle
 * - Animated focus states
 * - Error messages
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';

export interface AuthFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'floating' | 'filled';
  showValidation?: boolean;
}

export function AuthFormInput({
  label,
  error,
  success,
  helperText,
  icon,
  variant = 'default',
  showValidation = true,
  type,
  className = '',
  ref,
  ...props
}: AuthFormInputProps & { ref?: React.Ref<HTMLInputElement> }) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  const togglePassword = () => {
    HapticFeedback.light();
    setShowPassword(!showPassword);
  };

  const getBorderColor = () => {
    if (error) return 'border-red-500 focus:ring-red-500/20';
    if (success) return 'border-green-500 focus:ring-green-500/20';
    if (isFocused) return 'border-primary-500 focus:ring-primary-500/20';
    return 'border-white/10 hover:border-white/20 focus:ring-primary-500/20';
  };

  if (variant === 'floating') {
    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">{icon}</div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`peer w-full rounded-xl border bg-dark-800/50 px-4 pb-2 pt-6 text-white placeholder-transparent transition-all focus:outline-none focus:ring-2 ${icon ? 'pl-12' : ''} ${isPassword ? 'pr-12' : ''} ${getBorderColor()} `}
            placeholder={label}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          <motion.label
            animate={{
              y: isFocused || hasValue ? -10 : 0,
              scale: isFocused || hasValue ? 0.85 : 1,
              color: isFocused ? 'rgb(var(--color-primary-500))' : 'rgba(255,255,255,0.4)',
            }}
            className={`pointer-events-none absolute left-4 top-1/2 origin-left -translate-y-1/2 text-white/40 transition-colors ${icon ? 'left-12' : ''} `}
          >
            {label}
          </motion.label>

          {isPassword && (
            <button
              type="button"
              onClick={togglePassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 transition-colors hover:text-white/60"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          )}

          {showValidation && (success || error) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {success && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
              {error && <ExclamationCircleIcon className="h-5 w-5 text-red-500" />}
            </div>
          )}
        </div>

        <AnimatePresence>
          {(error || helperText) && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`mt-1.5 text-xs ${error ? 'text-red-400' : 'text-white/40'}`}
            >
              {error || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'filled') {
    return (
      <div className={className}>
        <label className="mb-1.5 block text-sm font-medium text-white/70">{label}</label>
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">{icon}</div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`w-full rounded-xl border-0 bg-dark-700/50 px-4 py-3 text-white placeholder-white/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${icon ? 'pl-12' : ''} ${isPassword ? 'pr-12' : ''} `}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={togglePassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 transition-colors hover:text-white/60"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        <AnimatePresence>
          {(error || helperText) && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`mt-1.5 text-xs ${error ? 'text-red-400' : 'text-white/40'}`}
            >
              {error || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default variant
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-white/70">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">{icon}</div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`w-full rounded-xl border bg-dark-800/50 px-4 py-3 text-white placeholder-white/40 transition-all focus:scale-[1.01] focus:outline-none focus:ring-2 ${icon ? 'pl-12' : ''} ${isPassword ? 'pr-12' : ''} ${getBorderColor()} `}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 transition-colors hover:text-white/60"
          >
            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        )}

        {showValidation && !isPassword && (success || error) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            {success && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
            {error && <ExclamationCircleIcon className="h-5 w-5 text-red-500" />}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {(error || helperText) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`mt-1.5 text-xs ${error ? 'text-red-400' : 'text-white/40'}`}
          >
            {error || helperText}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

AuthFormInput.displayName = 'AuthFormInput';

export default AuthFormInput;
