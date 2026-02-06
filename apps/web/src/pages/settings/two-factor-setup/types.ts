/**
 * TwoFactorSetup type definitions
 * @module pages/settings/two-factor-setup
 */

export interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export type SetupStep = 'intro' | 'scan' | 'verify' | 'backup' | 'complete';

export interface UseTwoFactorSetupReturn {
  step: SetupStep;
  setStep: (step: SetupStep) => void;
  setupData: TwoFactorSetupData | null;
  verificationCode: string[];
  isLoading: boolean;
  error: string;
  copiedSecret: boolean;
  copiedBackup: boolean;
  handleCodeChange: (index: number, value: string) => void;
  handleKeyDown: (index: number, e: React.KeyboardEvent) => void;
  handleVerify: () => Promise<void>;
  copySecret: () => void;
  copyBackupCodes: () => void;
  handleComplete: () => Promise<void>;
  stepIndex: number;
}
