/** StatsCard — displays a titled group of key-value statistics. */
import clsx from 'clsx';

/**
 * unknown for the admin module.
 */
/**
 * Stats Card display component.
 */
export function StatsCard({
  title,
  stats,
}: {
  title: string;
  stats: Array<{ label: string; value: string | number; highlight?: string }>;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
            <span
              className={clsx(
                'font-semibold',
                stat.highlight === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-white'
              )}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
