import type { ProfileThemeGridProps } from './types';
import { COL_CLASSES } from './constants';

export function ProfileThemeGrid({ children, columns = 3, className = '' }: ProfileThemeGridProps) {
  return <div className={`grid ${COL_CLASSES[columns]} gap-4 ${className}`}>{children}</div>;
}
