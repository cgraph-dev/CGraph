/**
 * Two-Factor Authentication Setup Page
 *
 * Step-by-step wizard for enabling 2FA with:
 * - QR code for authenticator app
 * - Manual entry code
 * - Backup codes generation
 * - Verification step
 *
 * @module pages/settings/two-factor-setup
 */

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import { useTwoFactorSetup } from './useTwoFactorSetup';
import { ProgressIndicator } from './progress-indicator';
import { IntroStep } from './intro-step';
import { ScanStep } from './scan-step';
import { VerifyStep } from './verify-step';
import { BackupStep } from './backup-step';
import { CompleteStep } from './complete-step';

/**
 * Two Factor Setup component.
 */
export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const {
    step,
    setStep,
    setupData,
    verificationCode,
    isLoading,
    error,
    copiedSecret,
    copiedBackup,
    handleCodeChange,
    handleKeyDown,
    handleVerify,
    copySecret,
    copyBackupCodes,
    handleComplete,
    stepIndex,
  } = useTwoFactorSetup();

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return <IntroStep onContinue={() => setStep('scan')} />;

      case 'scan':
        return (
          <ScanStep
            isLoading={isLoading}
            setupData={setupData}
            copiedSecret={copiedSecret}
            onCopySecret={copySecret}
            onContinue={() => setStep('verify')}
          />
        );

      case 'verify':
        return (
          <VerifyStep
            verificationCode={verificationCode}
            isLoading={isLoading}
            error={error}
            onCodeChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            onVerify={handleVerify}
            onBack={() => setStep('scan')}
          />
        );

      case 'backup':
        return (
          <BackupStep
            backupCodes={setupData?.backupCodes || []}
            isLoading={isLoading}
            copiedBackup={copiedBackup}
            onCopyBackupCodes={copyBackupCodes}
            onComplete={handleComplete}
          />
        );

      case 'complete':
        return <CompleteStep onDone={() => navigate('/settings/security')} />;

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-gradient-radial absolute -right-1/2 -top-1/2 h-full w-full rounded-full from-primary-500/10 to-transparent" />
        <div className="bg-gradient-radial absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full from-purple-500/10 to-transparent" />
      </div>

      <GlassCard variant="frosted" className="relative z-10 w-full max-w-md" hover3D={false}>
        <div className="p-8">
          {/* Progress Steps */}
          {step !== 'complete' && <ProgressIndicator stepIndex={stepIndex} />}

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div key={step}>{renderStep()}</motion.div>
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  );
}
