/**
 * BubbleStylesSection - Grid of bubble style presets
 */

import { CustomizationItemCard } from '@/modules/settings/components/customize';
import type { BubbleStylesSectionProps } from './types';

/**
 * unknown for the customize module.
 */
/**
 * Bubble Styles Section section component.
 */
export function BubbleStylesSection({
  bubbles,
  selectedBubble,
  previewingLockedItem,
  onSelect,
}: BubbleStylesSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {bubbles.map((bubble, index) => (
        <CustomizationItemCard
          key={bubble.id}
          item={bubble}
          index={index}
          isSelected={selectedBubble === bubble.id}
          isPreviewing={previewingLockedItem === bubble.id}
          onSelect={onSelect}
          layout="compact"
        >
          {/* Bubble Preview */}
          <div className="w-full space-y-2">
            <div
              className="ml-auto w-3/4 bg-primary-600 px-3 py-2 text-xs text-white"
              style={{
                borderRadius: bubble.borderRadius,
                boxShadow: bubble.shadow,
              }}
            >
              Your message
            </div>
            <div
              className="w-2/3 bg-white/[0.06] px-3 py-2 text-xs text-white"
              style={{
                borderRadius: bubble.borderRadius,
                boxShadow: bubble.shadow,
              }}
            >
              Reply
            </div>
          </div>
        </CustomizationItemCard>
      ))}
    </div>
  );
}
