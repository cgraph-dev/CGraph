/**
 * CrownIcon Component
 *
 * SVG crown icon for Ultimate tier users.
 */

import React from 'react';

interface CrownIconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * unknown for the gamification module.
 */
/**
 * Crown Icon component.
 */
export function CrownIcon({ className, style }: CrownIconProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 1L15.09 7.26L22 8.27L17 13.14L18.18 20.02L12 16.77L5.82 20.02L7 13.14L2 8.27L8.91 7.26L12 1Z" />
    </svg>
  );
}
