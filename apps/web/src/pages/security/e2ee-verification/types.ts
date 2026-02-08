export interface SafetyNumber {
  userId: string;
  partnerId: string;
  safetyNumber: string;
  fingerprint: string;
  isVerified: boolean;
  lastUpdated: string;
}
