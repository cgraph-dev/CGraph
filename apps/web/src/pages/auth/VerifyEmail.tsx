/**
 * Email Verification Page
 *
 * Handles email verification token processing.
 * Shows success/error states with appropriate actions.
 *
 * @version 1.1.0
 * @since v0.9.2
 */

import { useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '@/shared/components/ui';
import { useVerifyEmail } from '@/pages/auth/verify-email/useVerifyEmail';
import StatusDisplay from '@/pages/auth/verify-email/StatusDisplay';

// =============================================================================
// COMPONENT
// =============================================================================

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { state, isResending, resendSuccess, handleResend } = useVerifyEmail();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-gradient-radial absolute -right-1/2 -top-1/2 h-full w-full rounded-full from-primary-500/10 to-transparent" />
        <div className="bg-gradient-radial absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full from-purple-500/10 to-transparent" />
      </div>

      <GlassCard variant="frosted" className="relative z-10 w-full max-w-md" hover3D={false}>
        <div className="p-8">
          {/* Logo */}
          <div className="mb-6 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-purple-600">
                <span className="text-xl font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold text-white">CGraph</span>
            </Link>
          </div>

          <StatusDisplay
            state={state}
            isResending={isResending}
            resendSuccess={resendSuccess}
            onResend={handleResend}
            onNavigate={navigate}
          />
        </div>
      </GlassCard>
    </div>
  );
}
