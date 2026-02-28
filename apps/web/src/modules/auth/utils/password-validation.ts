/**
 * Shared password validation utility.
 *
 * Mirrors the complexity rules enforced on mobile
 * (`apps/mobile/src/screens/auth/register-screen/use-register.ts`)
 * so both clients reject weak passwords identically.
 *
 * @module modules/auth/utils/password-validation
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate a password against CGraph complexity requirements.
 *
 * Rules (aligned with mobile):
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain a lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain an uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain a number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Must contain a special character (!@#$%^&*)');
  }

  return { isValid: errors.length === 0, errors };
}
