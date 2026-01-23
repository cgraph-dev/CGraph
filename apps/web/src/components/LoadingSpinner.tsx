/**
 * LoadingSpinner - Simple full-page loading spinner
 *
 * Used as a Suspense fallback for lazy-loaded pages.
 * Provides a clean, minimal loading experience.
 *
 * @since v0.9.5
 */

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative h-12 w-12">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
          {/* Spinning gradient ring */}
          <div
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
            style={{
              borderTopColor: '#a78bfa',
              borderRightColor: '#8b5cf6',
              animationDuration: '0.8s',
            }}
          />
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-purple-500/10" />
        </div>

        {/* Brand text */}
        <div className="flex items-center gap-2 text-lg font-semibold text-white/80">
          <span className="text-purple-400">⬡</span>
          <span>CGraph</span>
        </div>
      </div>
    </div>
  );
}

export default LoadingSpinner;
