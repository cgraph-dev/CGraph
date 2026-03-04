/**
 * ProgressBar component - step progress indicator
 */

import { motion } from 'motion/react';
import { ONBOARDING_STEPS } from './constants';
import { tweens } from '@/lib/animation-presets';

interface ProgressBarProps {
  currentStep: number;
}

/**
 * unknown for the auth module.
 */
/**
 * Progress Bar component.
 */
export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex justify-between">
        {ONBOARDING_STEPS.map((step) => (
          <div
            key={step.id}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
              step.id === currentStep
                ? 'bg-primary-500 text-white shadow-glow-sm'
                : step.id < currentStep
                  ? 'bg-primary-500/30 text-primary-400'
                  : 'bg-white/[0.06] text-gray-500'
            }`}
          >
            {step.id < currentStep ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <span className="text-sm font-medium">{step.id}</span>
            )}
          </div>
        ))}
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep - 1) / (ONBOARDING_STEPS.length - 1)) * 100}%` }}
          transition={tweens.standard}
        />
      </div>
    </div>
  );
}
