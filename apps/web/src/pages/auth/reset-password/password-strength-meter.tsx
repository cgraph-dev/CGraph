/**
 * Password Strength Meter Component
 *
 * Visual indicator of password strength with requirement checklist.
 */

import { motion } from 'motion/react';
import type { PasswordStrength, PasswordRequirements } from './types';
import { REQUIREMENT_CONFIG } from './utils';

interface PasswordStrengthMeterProps {
  strength: PasswordStrength;
}

/**
 * unknown for the auth module.
 */
/**
 * Password Strength Meter component.
 */
export function PasswordStrengthMeter({ strength }: PasswordStrengthMeterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(strength.score / 5) * 100}%` }}
            className={`h-full ${strength.color} transition-all duration-300`}
          />
        </div>
        <span className="text-xs font-medium text-gray-400">{strength.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {REQUIREMENT_CONFIG.map(({ key, label }) => (
          <RequirementItem
            key={key}
            label={label}
            // type assertion: iterating config keys which are valid PasswordRequirements keys

             
            met={strength.requirements[key as keyof PasswordRequirements]}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface RequirementItemProps {
  label: string;
  met: boolean;
}

function RequirementItem({ label, met }: RequirementItemProps) {
  return (
    <div className={`flex items-center gap-1 ${met ? 'text-green-400' : 'text-gray-500'}`}>
      {met ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
        </svg>
      )}
      {label}
    </div>
  );
}
