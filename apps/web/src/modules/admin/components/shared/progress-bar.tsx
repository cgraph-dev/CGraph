/**
 * Admin progress bar component.
 * @module
 */
import clsx from 'clsx';

export function ProgressBar({
  label,
  value,
  max,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={clsx(
            'h-2 rounded-full transition-all',
            percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
