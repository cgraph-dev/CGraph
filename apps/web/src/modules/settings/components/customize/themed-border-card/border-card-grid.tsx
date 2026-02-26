/**
 * BorderCardGrid Component
 *
 * Grid container for border cards with responsive columns.
 */

import type { BorderCardGridProps } from './types';
import { COLUMN_CLASSES } from './constants';

/**
 * unknown for the settings module.
 */
/**
 * Border Card Grid display component.
 */
export function BorderCardGrid({ children, columns = 4, className = '' }: BorderCardGridProps) {
  const gridClass = COLUMN_CLASSES[columns] || COLUMN_CLASSES[4];

  return <div className={`grid ${gridClass} gap-4 ${className}`}>{children}</div>;
}
