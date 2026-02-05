/**
 * Accessibility Section
 *
 * Reduce motion and high contrast settings.
 */

import { EyeIcon } from '@heroicons/react/24/outline';

import { SectionHeader } from './SectionHeader';
import { Toggle } from './Toggle';

// =============================================================================
// TYPES
// =============================================================================

interface AccessibilityProps {
  /** Whether reduce motion is enabled */
  reduceMotion: boolean;
  /** Whether high contrast is enabled */
  highContrast: boolean;
  /** Callback to toggle reduce motion */
  toggleReduceMotion: () => void;
  /** Callback to toggle high contrast */
  toggleHighContrast: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Accessibility({
  reduceMotion,
  highContrast,
  toggleReduceMotion,
  toggleHighContrast,
}: AccessibilityProps) {
  return (
    <section>
      <SectionHeader
        icon={<EyeIcon className="h-5 w-5" />}
        title="Accessibility"
        description="Settings to improve readability and reduce distractions"
      />

      <div className="space-y-3">
        <Toggle
          enabled={reduceMotion}
          onChange={toggleReduceMotion}
          label="Reduce Motion"
          description="Minimize animations throughout the app"
        />

        <Toggle
          enabled={highContrast}
          onChange={toggleHighContrast}
          label="High Contrast"
          description="Increase contrast for better visibility"
        />
      </div>
    </section>
  );
}

export default Accessibility;
