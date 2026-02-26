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
  id: string;
  label: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const STEPS: StepInfo[] = [
  { id: 'intro', label: 'Start' },
  { id: 'scan', label: 'Scan' },
  { id: 'verify', label: 'Verify' },
  { id: 'backup', label: 'Backup' },
];
