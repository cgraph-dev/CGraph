import { cn } from '@/lib/utils';
import { getTheme } from './constants';
import { HolographicContainer } from './holographic-container';
import type { HolographicCardProps } from './types';

/**
 * HolographicCard Component
 *
 * Card with header, body, and footer sections
 */
export function HolographicCard({
  children,
  header,
  footer,
  colorTheme = 'cyan',
  className,
  onClick,
}: HolographicCardProps) {
  const theme = getTheme(colorTheme);

  return (
    <HolographicContainer
      config={{ colorTheme }}
      className={cn('p-0', className)}
      onClick={onClick}
    >
      {/* Header */}
      {header && (
        <div className="border-b px-6 py-4" style={{ borderColor: theme.primary + '40' }}>
          {header}
        </div>
      )}

      {/* Body */}
      <div className="px-6 py-4">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="border-t px-6 py-4" style={{ borderColor: theme.primary + '40' }}>
          {footer}
        </div>
      )}
    </HolographicContainer>
  );
}

export default HolographicCard;
