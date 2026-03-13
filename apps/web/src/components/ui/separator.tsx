/**
 * Separator Component
 *
 * Visual divider between content sections.
 */

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  decorative?: boolean;
}

/**
 * unknown for the ui module.
 */
/**
 * Separator component.
 */
export function Separator({
  orientation = 'horizontal',
  className = '',
  decorative = true,
}: SeparatorProps) {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={!decorative ? orientation : undefined}
      className={`bg-surfaceBorder shrink-0 ${orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]'} ${className} `}
    />
  );
}

export default Separator;
