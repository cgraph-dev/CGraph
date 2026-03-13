/**
 * Two-factor setup shared types and constants.
 * @module screens/settings/two-factor-setup/two-factor-types
 */
import { Dimensions } from 'react-native';

// =============================================================================
// TYPES
// =============================================================================

export interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export type SetupStep = 'intro' | 'scan' | 'verify' | 'backup' | 'complete';

export interface StepInfo {
  title: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const STEPS: Record<SetupStep, StepInfo> = {
  intro: { title: 'Start' },
  scan: { title: 'Scan' },
  verify: { title: 'Verify' },
  backup: { title: 'Backup' },
  complete: { title: 'Complete' },
};
