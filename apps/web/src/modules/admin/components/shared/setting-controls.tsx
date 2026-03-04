/**
 * Admin settings control components.
 * @module
 */
import clsx from 'clsx';

/**
 * unknown for the admin module.
 */
/**
 * Setting Toggle component.
 */
export function SettingToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={clsx(
          'relative h-6 w-12 rounded-full transition-colors',
          value ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        <span
          className={clsx(
            'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
            value ? 'left-7' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}

/**
 * unknown for the admin module.
 */
/**
 * Setting Number component.
 */
export function SettingNumber({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-right dark:border-white/[0.08] dark:bg-white/[0.06]"
      />
    </div>
  );
}
