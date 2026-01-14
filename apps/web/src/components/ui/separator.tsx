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

export function Separator({ 
  orientation = 'horizontal', 
  className = '',
  decorative = true
}: SeparatorProps) {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={!decorative ? orientation : undefined}
      className={`
        shrink-0 bg-surfaceBorder
        ${orientation === 'horizontal' ? 'h-[1px] w-full' : 'w-[1px] h-full'}
        ${className}
      `}
    />
  );
}

export default Separator;
