/**
 * Gaming stats grid type definitions.
 * @module
 */
export interface StatItem {
  label: string;
  value: number | string;
  icon?: string;
  suffix?: string;
  color?: string;
  animate?: boolean;
}

export interface GamingStatsGridProps {
  stats?: StatItem[];
  level?: number;
  xp?: number;
  maxXp?: number;
  rank?: string;
  rankIcon?: string;
  achievements?: number;
  className?: string;
}
