import { motion } from 'framer-motion';
import clsx from 'clsx';

type ColorKey = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
type ChangeType = 'positive' | 'negative' | 'neutral';

export function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  change: string;
  changeType: ChangeType;
  icon: React.ComponentType<{ className?: string }>;
  color: ColorKey;
}) {
  const colors: Record<ColorKey, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  const changeColors: Record<ChangeType, string> = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="mb-4 flex items-center justify-between">
        <div
          className={clsx(
            'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br',
            colors[color]
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {(value ?? 0).toLocaleString()}
      </p>
      <p className={clsx('mt-1 text-sm', changeColors[changeType])}>{change}</p>
    </motion.div>
  );
}
