/**
 * StatItem Component
 * Reusable stat display item
 */

import { memo } from 'react';
import type { StatItemProps } from './types';

export const StatItem = memo(function StatItem({
  label,
  value,
  suffix = '',
  color,
}: StatItemProps) {
  return (
    <div className="rounded p-2" style={{ backgroundColor: color + '11' }}>
      <div className="font-bold" style={{ color }}>
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  );
});
