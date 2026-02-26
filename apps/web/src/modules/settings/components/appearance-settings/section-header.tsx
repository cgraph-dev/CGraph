/**
 * Section Header Component
 *
 * Header with icon, title, and optional description.
 */

import type { SectionHeaderProps } from './types';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the settings module.
 */
/**
 * Section Header component.
 */
export function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="rounded-lg bg-primary-500/10 p-2 text-primary-400">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
    </div>
  );
}

export default SectionHeader;
