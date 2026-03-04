/**
 * Display Options Section
 *
 * Font size, message spacing, and display mode settings.
 */

import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

import { SectionHeader } from './section-header';
import { Slider } from './slider';

// =============================================================================
// TYPES
// =============================================================================

interface DisplayOptionsProps {
  /** Current font scale */
  fontScale: number;
  /** Current message spacing */
  messageSpacing: number;
  /** Current message display mode */
  messageDisplay: 'cozy' | 'compact';
  /** Callback to set font scale */
  setFontScale: (value: number) => void;
  /** Callback to set message spacing */
  setMessageSpacing: (value: number) => void;
  /** Callback to set message display mode */
  setMessageDisplay: (mode: 'cozy' | 'compact') => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the settings module.
 */
/**
 * Display Options component.
 */
export function DisplayOptions({
  fontScale,
  messageSpacing,
  messageDisplay,
  setFontScale,
  setMessageSpacing,
  setMessageDisplay,
}: DisplayOptionsProps) {
  return (
    <section>
      <SectionHeader
        icon={<AdjustmentsHorizontalIcon className="h-5 w-5" />}
        title="Display"
        description="Adjust text size and message density"
      />

      <div className="space-y-6 rounded-xl border border-white/[0.06] bg-white/[0.04] p-6">
        {/* Font Scale */}
        <Slider
          value={fontScale}
          min={0.8}
          max={1.4}
          step={0.1}
          onChange={setFontScale}
          label="Font Size"
          displayValue={`${Math.round(fontScale * 100)}%`}
        />

        {/* Message Spacing */}
        <Slider
          value={messageSpacing}
          min={0.5}
          max={2}
          step={0.1}
          onChange={setMessageSpacing}
          label="Message Spacing"
          displayValue={`${Math.round(messageSpacing * 100)}%`}
        />

        {/* Message Display Mode */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-300">Message Display</label>
          <div className="grid grid-cols-2 gap-3">
            {(['cozy', 'compact'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMessageDisplay(mode)}
                className={`rounded-lg border-2 p-4 transition-all ${
                  messageDisplay === mode
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-white/[0.08] hover:border-dark-500'
                } `}
              >
                <div className="flex flex-col items-center gap-2">
                  {mode === 'cozy' ? (
                    <div className="w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary-500" />
                        <div className="flex-1">
                          <div className="h-2 w-16 rounded bg-white/[0.08]" />
                          <div className="mt-1 h-1.5 w-24 rounded bg-white/[0.06]" />
                        </div>
                      </div>
                      <div className="ml-8 h-3 rounded bg-white/[0.06]" />
                    </div>
                  ) : (
                    <div className="w-full space-y-1">
                      <div className="flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-primary-500" />
                        <div className="h-2 w-12 rounded bg-white/[0.08]" />
                        <div className="h-2 flex-1 rounded bg-white/[0.06]" />
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-green-500" />
                        <div className="h-2 w-10 rounded bg-white/[0.08]" />
                        <div className="h-2 flex-1 rounded bg-white/[0.06]" />
                      </div>
                    </div>
                  )}
                  <span className="text-sm font-medium capitalize text-white">{mode}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DisplayOptions;
