/**
 * Reset Password Utilities
 *
 * Helper functions and constants for password validation.
 */

import { durations } from '@cgraph/animation-constants';
import type { PasswordStrength, RequirementConfig } from './types';

/**
 * Strength label mapping by score
 */
const STRENGTH_LABELS = {
  0: { label: 'Very Weak', color: 'bg-red-500' },
  1: { label: 'Weak', color: 'bg-red-400' },
  2: { label: 'Fair', color: 'bg-orange-500' },
  3: { label: 'Good', color: 'bg-yellow-500' },
  4: { label: 'Strong', color: 'bg-green-500' },
  5: { label: 'Very Strong', color: 'bg-emerald-500' },
} as const;

/**
 * Password requirement display configuration
 */
export const REQUIREMENT_CONFIG: RequirementConfig[] = [
  { key: 'minLength', label: '8+ characters' },
  { key: 'hasUppercase', label: 'Uppercase letter' },
  { key: 'hasLowercase', label: 'Lowercase letter' },
  { key: 'hasNumber', label: 'Number' },
  { key: 'hasSpecial', label: 'Special character' },
];

/**
 * Calculate password strength based on requirements
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
   
  const scoreKey = Math.min(Math.max(score, 0), 5) as 0 | 1 | 2 | 3 | 4 | 5; // type assertion: numeric score clamped to valid range
  const scoreData = STRENGTH_LABELS[scoreKey];

  return {
    score,
    label: scoreData.label,
    color: scoreData.color,
    requirements,
  };
}

/**
 * Animation variants for container
 */
export const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slower.ms / 1000,
      staggerChildren: 0.1,
    },
  },
};

/**
 * Animation variants for items
 */
export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};
