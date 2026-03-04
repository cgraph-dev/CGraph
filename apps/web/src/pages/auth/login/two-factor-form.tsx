/**
 * Two-factor authentication verification form for the login flow.
 *
 * Renders a 6-digit TOTP code input with backup code fallback,
 * error display, and loading state. Shown after credentials are
 * validated when the user has 2FA enabled.
 *
 * @module pages/auth/login/TwoFactorForm
 */

import { useState, useRef, useEffect } from 'react';
import { motion, type Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { AuthErrorAlert } from '@/pages/auth/register/auth-error-alert';
import { SubmitButton } from '@/components/ui/submit-button';

interface TwoFactorFormProps {
  /** Temp token from the 2fa_required login response */
  twoFactorToken: string;
  /** Whether a verification request is in progress */
  isLoading: boolean;
  /** Error message from the last verification attempt */
  error: string | null;
  /** Called with the 6-digit TOTP or backup code */
  onVerify: (code: string) => void;
  /** Returns to the credentials step */
  onBack: () => void;
  /** Motion variants for stagger animation (optional) */
  itemVariants?: Variants;
  /** Whether reduced motion is preferred */
  reduced?: boolean;
}

/**
 * Two-factor verification form for login.
 */
export function TwoFactorForm({
  twoFactorToken: _twoFactorToken,
  isLoading,
  error,
  onVerify,
  onBack,
  itemVariants,
  reduced,
}: TwoFactorFormProps) {
  const { t } = useTranslation('auth');
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input on mount and mode switch
  useEffect(() => {
    inputRef.current?.focus();
  }, [useBackupCode]);

  const handleCodeChange = (value: string) => {
    if (useBackupCode) {
      // Backup codes can contain letters and digits
      setCode(value);
      return;
    }

    // TOTP: numeric only, max 6 digits
    const numeric = value.replace(/\D/g, '').slice(0, 6);
    setCode(numeric);

    // Auto-submit when 6 digits entered
    if (numeric.length === 6) {
      onVerify(numeric);
    }
  };

  const handleSubmit = () => {
    if (!code.trim()) return;
    onVerify(code.trim());
  };

  const toggleBackupCode = () => {
    setCode('');
    setUseBackupCode((prev) => !prev);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={reduced ? {} : itemVariants} className="text-center lg:text-left">
        <h3 className="text-xl font-semibold text-white">
          {t('login.two_factor_title', 'Two-Factor Authentication')}
        </h3>
        <p className="mt-2 text-sm text-gray-400">
          {useBackupCode
            ? t('login.two_factor_backup_hint', 'Enter one of your backup codes to sign in.')
            : t(
                'login.two_factor_hint',
                'Enter the 6-digit code from your authenticator app to continue.'
              )}
        </p>
      </motion.div>

      {/* Error Alert */}
      <AuthErrorAlert error={error} />

      {/* Form */}
      <form action={handleSubmit} className="space-y-5">
        <motion.div variants={reduced ? {} : itemVariants}>
          <label htmlFor="two-factor-code" className="mb-2 block text-sm font-medium text-gray-300">
            {useBackupCode
              ? t('login.backup_code_label', 'Backup code')
              : t('login.totp_code_label', 'Verification code')}
          </label>
          <motion.input
            ref={inputRef}
            id="two-factor-code"
            type={useBackupCode ? 'text' : 'text'}
            inputMode={useBackupCode ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            disabled={isLoading}
            maxLength={useBackupCode ? 20 : 6}
            className="matrix-input w-full rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-white placeholder-gray-500 transition-all duration-300 hover:border-dark-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
            whileFocus={reduced ? {} : { scale: 1.01 }}
          />
        </motion.div>

        <motion.div variants={reduced ? {} : itemVariants}>
          <SubmitButton
            pendingText={t('login.verifying', 'Verifying...')}
            className="matrix-button w-full py-3"
            disabled={isLoading || !code.trim()}
          >
            <span>{t('login.verify_code', 'Verify')}</span>
          </SubmitButton>
        </motion.div>
      </form>

      {/* Toggle backup code mode */}
      <motion.div
        variants={reduced ? {} : itemVariants}
        className="flex flex-col items-center gap-3"
      >
        <button
          type="button"
          onClick={toggleBackupCode}
          disabled={isLoading}
          className="text-sm text-gray-400 transition-colors hover:text-primary-400"
        >
          {useBackupCode
            ? t('login.use_authenticator', 'Use authenticator app instead')
            : t('login.use_backup_code', 'Use a backup code instead')}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="matrix-link text-sm font-medium"
        >
          {t('login.back_to_login', 'Back to login')}
        </button>
      </motion.div>
    </div>
  );
}
