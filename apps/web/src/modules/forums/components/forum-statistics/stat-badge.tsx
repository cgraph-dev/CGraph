/**
 * Forum statistics badge component.
 * @module
 */
import type { StatBadgeProps } from '@/modules/forums/components/forum-statistics/forum-statistics.types';

export function StatBadge({ icon, label, value }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
      {icon}
      <span className="font-medium">{value.toLocaleString()}</span>
      <span className="text-gray-400">{label}</span>
    </div>
  );
}
