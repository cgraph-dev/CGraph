/** ProfileThemeGrid — responsive grid layout for profile theme cards. */
import type { ProfileThemeGridProps } from './types';
import { COL_CLASSES } from './constants';

/**
 * unknown for the settings module.
 */
/**
 * Profile Theme Grid component.
 */
export function ProfileThemeGrid({ children, columns = 3, className = '' }: ProfileThemeGridProps) {
  return <div className={`grid ${COL_CLASSES[columns]} gap-4 ${className}`}>{children}</div>;
}
