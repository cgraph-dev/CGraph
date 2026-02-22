/**
 * Live Preview Section
 *
 * Real-time preview of current theme and display settings.
 */

import { SparklesIcon } from '@heroicons/react/24/outline';

import type { Theme } from '@/lib/theme/theme-engine';
import { SectionHeader } from './section-header';

// =============================================================================
// TYPES
// =============================================================================

interface LivePreviewProps {
  /** Current theme */
  theme: Theme;
  /** Current font scale */
  fontScale: number;
  /** Current message spacing */
  messageSpacing: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LivePreview({ theme, fontScale, messageSpacing }: LivePreviewProps) {
  return (
    <section>
      <SectionHeader
        icon={<SparklesIcon className="h-5 w-5" />}
        title="Preview"
        description="See how your settings look"
      />

      <div
        className="relative overflow-hidden rounded-xl border p-6"
        style={{
          background: theme.colors.background,
          borderColor: theme.colors.surfaceBorder,
        }}
      >
        {/* Scanlines for special themes */}
        {theme.animations.enableScanlines && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                ${theme.colors.holoScanline}05 2px,
                ${theme.colors.holoScanline}05 4px
              )`,
            }}
          />
        )}

        {/* Sample message */}
        <div
          className="relative flex gap-3 rounded-lg p-4"
          style={{
            background: theme.colors.surface,
            fontSize: `${fontScale}rem`,
            marginBottom: `${messageSpacing}rem`,
          }}
        >
          <div
            className="h-10 w-10 flex-shrink-0 rounded-full"
            style={{
              background: theme.colors.primary,
              boxShadow: theme.animations.enableGlow
                ? `0 0 15px ${theme.colors.holoGlow}`
                : undefined,
            }}
          />
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold" style={{ color: theme.colors.primary }}>
                CGraph User
              </span>
              <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                Today at 12:00 PM
              </span>
            </div>
            <p className="mt-1" style={{ color: theme.colors.textPrimary }}>
              This is how your messages will look with the current settings. The theme affects
              colors, and display settings adjust sizing and spacing.
            </p>
          </div>
        </div>

        {/* Sample input */}
        <div
          className="relative flex items-center gap-2 rounded-lg p-3"
          style={{
            background: theme.colors.surfaceElevated,
            border: `1px solid ${theme.colors.surfaceBorder}`,
          }}
        >
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none"
            style={{
              color: theme.colors.textPrimary,
              fontSize: `${fontScale}rem`,
            }}
            readOnly
          />
          <button
            className="rounded-lg px-4 py-2 font-medium transition-colors"
            style={{
              background: theme.colors.primary,
              color: '#fff',
              boxShadow: theme.animations.enableGlow
                ? `0 0 10px ${theme.colors.holoGlow}`
                : undefined,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

export default LivePreview;
