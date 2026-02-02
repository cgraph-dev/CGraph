/**
 * PasswordStrengthMeter Component
 *
 * Visual password strength indicator with requirements checklist.
 * Features:
 * - Animated strength bar
 * - Requirements checklist
 * - Color-coded strength levels
 * - Multiple variants
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export interface PasswordStrengthMeterProps {
  password: string;
  variant?: 'bar' | 'detailed' | 'minimal';
  showRequirements?: boolean;
  minLength?: number;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const DEFAULT_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const STRENGTH_LEVELS = [
  { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-400', min: 0 },
  { label: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-400', min: 2 },
  { label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-400', min: 3 },
  { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-400', min: 4 },
  { label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400', min: 5 },
];

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  variant = 'detailed',
  showRequirements = true,
  minLength = 8,
  className = '',
}) => {
  const requirements = useMemo(() => {
    return DEFAULT_REQUIREMENTS.map((r) =>
      r.label === 'At least 8 characters'
        ? {
            ...r,
            label: `At least ${minLength} characters`,
            test: (p: string) => p.length >= minLength,
          }
        : r
    );
  }, [minLength]);

  const passedRequirements = useMemo(() => {
    return requirements.filter((r) => r.test(password)).length;
  }, [password, requirements]);

  const strength = useMemo(() => {
    const result = STRENGTH_LEVELS.reduce((acc, level) => {
      return passedRequirements >= level.min ? level : acc;
    }, STRENGTH_LEVELS[0]!);
    return result;
  }, [passedRequirements]);

  const strengthPercentage = (passedRequirements / requirements.length) * 100;

  if (!password) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-2 ${className}`}
      >
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strengthPercentage}%` }}
            className={`h-full ${strength.color}`}
          />
        </div>
        <span className={`text-xs ${strength.textColor}`}>{strength.label}</span>
      </motion.div>
    );
  }

  if (variant === 'bar') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-white/60">Password Strength</span>
          <span className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</span>
        </div>
        <div className="flex gap-1">
          {STRENGTH_LEVELS.map((level, index) => (
            <motion.div
              key={level.label}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: passedRequirements > index ? 1 : 0.2 }}
              className={`h-1.5 flex-1 origin-left rounded-full ${passedRequirements > index ? level.color : 'bg-white/10'} `}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // Detailed variant
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={className}
    >
      {/* Strength bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className={`h-4 w-4 ${strength.textColor}`} />
            <span className="text-sm text-white/70">Password Strength</span>
          </div>
          <motion.span
            key={strength.label}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-sm font-semibold ${strength.textColor}`}
          >
            {strength.label}
          </motion.span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strengthPercentage}%` }}
            transition={{ type: 'spring', damping: 15 }}
            className={`h-full ${strength.color} rounded-full`}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <AnimatePresence>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {requirements.map((requirement, index) => {
              const passed = requirement.test(password);
              return (
                <motion.li
                  key={requirement.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`flex h-4 w-4 items-center justify-center rounded-full ${passed ? 'bg-green-500/20' : 'bg-white/10'} `}
                  >
                    {passed ? (
                      <CheckIcon className="h-3 w-3 text-green-500" />
                    ) : (
                      <XMarkIcon className="h-3 w-3 text-white/40" />
                    )}
                  </motion.div>
                  <span className={`text-xs ${passed ? 'text-green-400' : 'text-white/50'}`}>
                    {requirement.label}
                  </span>
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default PasswordStrengthMeter;
