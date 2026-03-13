/** StatCard — icon-labeled statistic display for forum statistics. */
import type { StatCardProps } from '@/modules/forums/components/forum-statistics/forum-statistics.types';

/**
 * unknown for the forums module.
 */
/**
 * Stat Card display component.
 */
export function StatCard({
  icon,
  label,
  value,
  subValue,
  iconColor = 'text-gray-500',
}: StatCardProps) {
  return (
    <div className="dark:bg-white/[0.06]/50 flex items-start gap-3 rounded-lg bg-gray-50 p-3">
      <div className={iconColor}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">{label}</div>
        {subValue && (
          <div className="mt-1 text-xs text-green-600 dark:text-green-400">{subValue}</div>
        )}
      </div>
    </div>
  );
}
