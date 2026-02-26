/**
 * LoadingSpinner - Simple full-page loading spinner
 *
 * Used as a Suspense fallback for lazy-loaded pages.
 * Provides a clean, minimal loading experience.
 *
 * @since v0.9.5
 */

/**
 * unknown for the feedback module.
 */
/**
 * Loading Spinner — loading placeholder.
 */
export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner with gradient */}
        <div className="relative h-12 w-12">
          {/* SVG gradient spinner */}
          <svg
            className="h-12 w-12 animate-spin"
            viewBox="0 0 50 50"
            style={{ animationDuration: '1s' }}
          >
            <defs>
              <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="url(#spinnerGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="80 45"
            />
          </svg>
          {/* Inner glow */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-purple-500/20 to-emerald-500/10" />
        </div>

        {/* Brand text with gradient */}
        <span
          className="text-lg font-semibold"
          style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          CGraph
        </span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
