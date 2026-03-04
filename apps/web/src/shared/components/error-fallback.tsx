/**
 * ErrorFallback
 *
 * User-friendly error fallback displayed inside error boundaries.
 * Offers retry, go-back, and report actions so users can recover
 * without losing context.
 *
 * @module shared/components/ErrorFallback
 */

import { motion } from 'framer-motion';
import { transitions } from '@cgraph/animation-constants';

// ── Types ───────────────────────────────────────────────────────────────

interface ErrorFallbackProps {
  /** The error that was thrown */
  error: Error;
  /** Callback to reset the error boundary and retry rendering */
  resetErrorBoundary: () => void;
  /** Optional route/component name for context */
  componentName?: string;
}

// ── Icons ───────────────────────────────────────────────────────────────

function ShieldAlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286ZM12 15h.008v.008H12V15Z"
      />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
      />
    </svg>
  );
}

// ── Component ───────────────────────────────────────────────────────────

/**
 * Renders a friendly error screen with recovery actions.
 *
 * Actions:
 * - **Try Again** — resets the error boundary to re-render children
 * - **Go Back**  — navigates to previous history entry
 * - **Report**   — opens a bug report (mailto/link)
 *
 * @example
 * ```tsx
 * <ErrorBoundary FallbackComponent={ErrorFallback}>
 *   <MyRouteComponent />
 * </ErrorBoundary>
 * ```
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
  componentName,
}: ErrorFallbackProps): React.ReactElement {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleReport = () => {
    const subject = encodeURIComponent(`Bug Report: ${error.name}`);
    const body = encodeURIComponent(
      [
        `Error: ${error.message}`,
        `Component: ${componentName ?? 'unknown'}`,
        `URL: ${window.location.href}`,
        `Time: ${new Date().toISOString()}`,
        `User Agent: ${navigator.userAgent}`,
      ].join('\n'),
    );
    window.open(`mailto:support@cgraph.app?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <motion.div
      {...transitions.fadeIn}
      className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center"
      role="alert"
    >
      {/* Icon */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-900/10">
        <ShieldAlertIcon className="h-8 w-8 text-red-400" />
      </div>

      {/* Heading */}
      <h2 className="mb-2 text-xl font-semibold text-white">Something went wrong</h2>

      {/* Description */}
      <p className="mb-6 max-w-md text-sm text-gray-400">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Primary: retry */}
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        >
          Try Again
        </button>

        {/* Secondary: go back */}
        <button
          type="button"
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/[0.12]"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Go Back
        </button>

        {/* Tertiary: report */}
        <button
          type="button"
          onClick={handleReport}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 transition-colors hover:text-gray-300"
        >
          <FlagIcon className="h-4 w-4" />
          Report
        </button>
      </div>

      {/* Dev-only error details */}
      {import.meta.env.DEV && (
        <details className="mt-8 w-full max-w-lg text-left">
          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-300">
            Error Details (Dev)
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)]/[0.85] p-4 text-xs text-red-400 backdrop-blur-[16px]">
            {error.stack ?? error.toString()}
          </pre>
        </details>
      )}
    </motion.div>
  );
}

export default ErrorFallback;
