/**
 * Types for E2EE verification screen.
 * @module screens/security/e2-ee-verification-screen/types
 */

export interface SafetyNumber {
  userId: string;
  partnerId: string;
  safetyNumber: string;
  fingerprint: string;
  isVerified: boolean;
  lastUpdated: string;
}

export type RouteParams = {
  E2EEVerification: {
    userId: string;
    username: string;
  };
};
