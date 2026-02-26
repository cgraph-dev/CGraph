/**
 * HoloCard Component
 * @module components/enhanced/ui/holographic-ui/components/card
 */

import { cn } from '@/lib/utils';
import type { HoloCardProps } from '../types';
import { getTheme } from '../presets';
import { HoloContainer } from './container';

/**
 * unknown for the enhanced module.
 */
/**
 * Holo Card display component.
 */
export function HoloCard({
  children,
  header,
  footer,
  preset = 'cyan',
  hoverable = true,
  onClick,
  className,
}: HoloCardProps) {
  const theme = getTheme(preset);

  return (
    <HoloContainer
      preset={preset}
      className={cn(hoverable && 'cursor-pointer', className)}
      onClick={onClick}
      whileHover={hoverable ? { y: -4, scale: 1.01 } : undefined}
    >
      {header && (
        <div className="border-b px-5 py-4" style={{ borderColor: theme.border }}>
          {header}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="border-t px-5 py-4" style={{ borderColor: theme.border }}>
          {footer}
        </div>
      )}
    </HoloContainer>
  );
}
