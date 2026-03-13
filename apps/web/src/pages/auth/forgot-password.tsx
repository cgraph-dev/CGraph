/** ForgotPassword — password reset request page with email submission form. */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, getErrorMessage } from '@/lib/api';
import { LogoIcon } from '@/components/logo';
import { SubmitButton } from '@/components/ui/submit-button';

/**
 * Forgot Password component.
 */
export default function ForgotPassword() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss error after 1.5 seconds
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [error]);

  const forgotPasswordAction = async () => {
    setError(null);

    try {
      await api.post('/api/v1/auth/forgot-password', { email });
      setIsSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4">
        {/* Mobile Logo */}
        <div className="text-center lg:hidden">
          <a href="https://www.cgraph.org" className="inline-flex items-center gap-3">
            <LogoIcon size={192} color="gradient" showGlow={false} />
          </a>
        </div>

        {/* Success Message */}
        <div className="text-center lg:text-left">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 lg:mx-0">
            <svg
              className="h-8 w-8 text-green-400"
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
          </div>
          <h2 className="text-3xl font-bold text-white">{t('forgot_password.check_email')}</h2>
          <p className="mt-2 text-gray-400">
            {t('forgot_password.reset_link_sent')} <span className="text-white">{email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {t('forgot_password.didnt_receive')}{' '}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-primary-400 transition-colors hover:text-primary-300"
            >
              {t('forgot_password.try_another')}
            </button>
          </p>

          <Link
            to="/login"
            className="block w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-center font-medium text-white transition-colors hover:bg-white/[0.08]"
          >
            {t('forgot_password.back_to_login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Logo */}
      <div className="text-center lg:hidden">
        <a href="https://www.cgraph.org" className="inline-flex items-center gap-3">
          <LogoIcon size={192} color="gradient" showGlow={false} />
        </a>
      </div>

      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white">{t('forgot_password.title')}</h2>
        <p className="mt-2 text-gray-400">{t('forgot_password.subtitle')}</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      <form action={forgotPasswordAction} className="space-y-6">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
            {t('forgot_password.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="you@example.com"
          />
        </div>

        <SubmitButton pendingText="Sending..." className="auth-cta-button w-full py-3">
          {t('forgot_password.submit')}
        </SubmitButton>
      </form>

      {/* Back to Login */}
      <Link
        to="/login"
        className="flex items-center justify-center gap-2 text-gray-400 transition-colors hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to login
      </Link>
    </div>
  );
}
