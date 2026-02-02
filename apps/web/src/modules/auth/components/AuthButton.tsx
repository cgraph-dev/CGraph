/**
 * AuthButton Component
 *
 * Primary action button for auth forms with loading states.
 * Features:
 * - Loading spinner
 * - Success/error states
 * - Gradient variants
 * - Animated hover effects
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

export interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isSuccess = false,
  isError = false,
  loadingText = 'Please wait...',
  successText = 'Success!',
  errorText = 'Try again',
  fullWidth = true,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    HapticFeedback.medium();
    onClick?.(e);
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-primary-500 to-purple-600 text-white
      hover:from-primary-400 hover:to-purple-500
      shadow-lg shadow-primary-500/25
      disabled:from-gray-600 disabled:to-gray-700
    `,
    secondary: `
      bg-white/10 text-white
      hover:bg-white/20
      disabled:bg-white/5 disabled:text-white/50
    `,
    outline: `
      border-2 border-primary-500 text-primary-400
      hover:bg-primary-500/10
      disabled:border-gray-600 disabled:text-gray-500
    `,
    ghost: `
      text-white/70
      hover:bg-white/10 hover:text-white
      disabled:text-white/30
    `,
  };

  const isDisabled = disabled || isLoading || isSuccess || isError;

  const getContent = () => {
    if (isLoading) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center gap-2"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
          />
          <span>{loadingText}</span>
        </motion.div>
      );
    }

    if (isSuccess) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
          >
            <CheckIcon className="h-5 w-5" />
          </motion.div>
          <span>{successText}</span>
        </motion.div>
      );
    }

    if (isError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <XMarkIcon className="h-5 w-5" />
          <span>{errorText}</span>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-2"
      >
        {icon && iconPosition === 'left' && icon}
        <span>{children}</span>
        {icon && iconPosition === 'right' && icon}
      </motion.div>
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`relative overflow-hidden rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${isSuccess ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''} ${isError ? 'bg-gradient-to-r from-red-500 to-rose-500' : ''} ${className} `}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {/* Shimmer effect */}
      {variant === 'primary' && !isDisabled && (
        <motion.div
          animate={{
            x: ['0%', '200%'],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: 'linear',
          }}
          className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{ width: '50%' }}
        />
      )}

      <AnimatePresence mode="wait">{getContent()}</AnimatePresence>
    </button>
  );
};

export default AuthButton;
