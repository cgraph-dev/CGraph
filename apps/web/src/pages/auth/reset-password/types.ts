/**
 * Reset Password Types
 *
 * Type definitions for the reset password component.
 */

/**
 * State of the reset password flow
 */
export type ResetState = 'validating' | 'form' | 'success' | 'expired' | 'error';

/**
 * Password requirement checks
 */
export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

/**
 * Password strength evaluation result
 */
export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: PasswordRequirements;
}

/**
 * Password requirement display config
 */
export interface RequirementConfig {
  key: keyof PasswordRequirements;
  label: string;
}
