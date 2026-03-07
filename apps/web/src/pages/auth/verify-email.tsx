/**
 * Email Verification Page
 *
 * Handles email verification token processing.
 * Shows success/error states with appropriate actions.
 *
 * @version 1.1.0
 * @since v0.9.2
 */

import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/shared/components/ui';
import { useVerifyEmail } from '@/pages/auth/verify-email/useVerifyEmail';
import StatusDisplay from '@/pages/auth/verify-email/status-display';
import { LogoIcon } from '@/components/logo';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Verify Email component.
 */
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
            <a href="https://www.cgraph.org" className="inline-flex items-center gap-2">
              <LogoIcon size={64} color="gradient" showGlow={false} />
            </a>
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
