/**
 * Two-Factor Authentication Setup Page
 *
 * Step-by-step wizard for enabling 2FA with:
 * - QR code for authenticator app
 * - Manual entry code
 * - Backup codes generation
 * - Verification step
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import GlassCard from '@/components/ui/GlassCard';

// =============================================================================
// TYPES
// =============================================================================

interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

type SetupStep = 'intro' | 'scan' | 'verify' | 'backup' | 'complete';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<SetupStep>('intro');
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Generate 2FA secret on entering scan step
  useEffect(() => {
    async function generateSecret() {
      if (step !== 'scan' || setupData) return;

      setIsLoading(true);
      try {
        const response = await api.post('/api/v1/auth/2fa/setup');
        setSetupData(response.data);
      } catch (_err) {
        setError('Failed to generate 2FA secret. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    generateSecret();
  }, [step, setupData]);

  // Handle verification code input
  const handleCodeChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) {
        // Handle paste
        const digits = value.replace(/\D/g, '').slice(0, 6).split('');
        const newCode = [...verificationCode];
        digits.forEach((digit, i) => {
          if (index + i < 6) newCode[index + i] = digit;
        });
        setVerificationCode(newCode);
        // Focus next empty or last input
        const nextIndex = Math.min(index + digits.length, 5);
        document.getElementById(`code-${nextIndex}`)?.focus();
      } else if (/^\d$/.test(value) || value === '') {
        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);
        // Auto-focus next input
        if (value && index < 5) {
          document.getElementById(`code-${index + 1}`)?.focus();
        }
      }
    },
    [verificationCode]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
        document.getElementById(`code-${index - 1}`)?.focus();
      }
    },
    [verificationCode]
  );

  // Verify the code
  const handleVerify = useCallback(async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/api/v1/auth/2fa/verify', { code });
      setStep('backup');
    } catch {
      setError('Invalid code. Please try again.');
      setVerificationCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [verificationCode]);

  // Copy to clipboard helpers
  const copySecret = useCallback(() => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }, [setupData?.secret]);

  const copyBackupCodes = useCallback(() => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  }, [setupData?.backupCodes]);

  // Finalize setup
  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/api/v1/auth/2fa/enable');
      setStep('complete');
    } catch {
      setError('Failed to enable 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="text-center">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Enable Two-Factor Authentication</h2>
              <p className="mt-2 text-gray-400">Add an extra layer of security to your account</p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              {[
                {
                  icon: '🔐',
                  title: 'Enhanced Security',
                  desc: 'Protect your account from unauthorized access',
                },
                {
                  icon: '📱',
                  title: 'Authenticator App',
                  desc: 'Use Google Authenticator, Authy, or similar',
                },
                {
                  icon: '💾',
                  title: 'Backup Codes',
                  desc: 'Get recovery codes in case you lose access',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-xl border border-dark-600 bg-dark-800/30 p-4"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="font-medium text-white">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.button
              variants={itemVariants}
              onClick={() => setStep('scan')}
              className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40"
            >
              Get Started
            </motion.button>
          </motion.div>
        );

      case 'scan':
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="text-center">
              <h2 className="text-xl font-bold text-white">Scan QR Code</h2>
              <p className="mt-2 text-sm text-gray-400">
                Scan this code with your authenticator app
              </p>
            </motion.div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              </div>
            ) : setupData ? (
              <>
                {/* QR Code */}
                <motion.div variants={itemVariants} className="flex justify-center">
                  <div className="rounded-2xl bg-white p-4">
                    <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="h-48 w-48" />
                  </div>
                </motion.div>

                {/* Manual Entry */}
                <motion.div variants={itemVariants}>
                  <p className="mb-2 text-center text-sm text-gray-400">
                    Or enter this code manually:
                  </p>
                  <div className="flex items-center gap-2 rounded-xl bg-dark-800/50 p-3">
                    <code className="flex-1 text-center font-mono text-lg tracking-wider text-primary-400">
                      {setupData.secret.match(/.{1,4}/g)?.join(' ')}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="p-2 text-gray-400 transition-colors hover:text-white"
                    >
                      {copiedSecret ? (
                        <svg
                          className="h-5 w-5 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  onClick={() => setStep('verify')}
                  className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40"
                >
                  Continue
                </motion.button>
              </>
            ) : null}
          </motion.div>
        );

      case 'verify':
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="text-center">
              <h2 className="text-xl font-bold text-white">Verify Setup</h2>
              <p className="mt-2 text-sm text-gray-400">
                Enter the 6-digit code from your authenticator app
              </p>
            </motion.div>

            {/* Code Input */}
            <motion.div variants={itemVariants} className="flex justify-center gap-2">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="h-14 w-12 rounded-xl border-2 border-dark-600 bg-dark-800/50 text-center text-2xl font-bold text-white transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
              ))}
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-sm text-red-400"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              variants={itemVariants}
              onClick={handleVerify}
              disabled={isLoading || verificationCode.some((d) => !d)}
              className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </motion.button>

            <motion.button
              variants={itemVariants}
              onClick={() => setStep('scan')}
              className="w-full py-2 text-gray-400 transition-colors hover:text-white"
            >
              Back to QR Code
            </motion.button>
          </motion.div>
        );

      case 'backup':
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Save Backup Codes</h2>
              <p className="mt-2 text-sm text-gray-400">
                Store these codes safely. You&apos;ll need them if you lose access to your
                authenticator.
              </p>
            </motion.div>

            {/* Backup Codes Grid */}
            <motion.div variants={itemVariants} className="rounded-xl bg-dark-800/50 p-4">
              <div className="mb-4 grid grid-cols-2 gap-2">
                {setupData?.backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-dark-700 px-3 py-2 font-mono text-sm text-gray-300"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={copyBackupCodes}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dark-600 py-2 text-sm text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
              >
                {copiedBackup ? (
                  <>
                    <svg
                      className="h-4 w-4 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy All Codes
                  </>
                )}
              </button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-400"
            >
              <strong>Important:</strong> Each code can only be used once. Store them in a secure
              location like a password manager.
            </motion.div>

            <motion.button
              variants={itemVariants}
              onClick={handleComplete}
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Enabling 2FA...' : "I've Saved My Codes"}
            </motion.button>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="py-8 text-center"
          >
            <motion.div
              variants={itemVariants}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-400"
            >
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>

            <motion.h2 variants={itemVariants} className="mb-2 text-2xl font-bold text-white">
              2FA Enabled!
            </motion.h2>

            <motion.p variants={itemVariants} className="mb-8 text-gray-400">
              Your account is now protected with two-factor authentication.
            </motion.p>

            <motion.button
              variants={itemVariants}
              onClick={() => navigate('/settings/security')}
              className="rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 px-8 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40"
            >
              Done
            </motion.button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Step indicator
  const stepIndex = ['intro', 'scan', 'verify', 'backup', 'complete'].indexOf(step);

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
          {step !== 'complete' && (
            <div className="mb-8 flex justify-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i <= stepIndex ? 'w-8 bg-primary-500' : 'w-4 bg-dark-600'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div key={step}>{renderStep()}</motion.div>
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  );
}
