/**
 * Key verification type definitions.
 * @module
 */
export interface VerificationState {
  safetyNumber: string | null;
  isVerified: boolean;
  loading: boolean;
  error: string | null;
}
