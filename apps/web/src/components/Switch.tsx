interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}: SwitchProps) {
  const sizes = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'h-3 w-3',
      translate: 'translate-x-4',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'h-6 w-6',
      translate: 'translate-x-7',
    },
  };

  const currentSize = sizes[size];

  return (
    <label
      className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 ${currentSize.track} rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 hover:shadow-md ${
          checked ? 'bg-primary-600 hover:bg-primary-700' : 'bg-dark-600 hover:bg-dark-500'
        }`}
      >
        <span
          className={`${currentSize.thumb} inline-block rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out ${
            checked ? currentSize.translate : 'translate-x-0.5'
          }`}
          style={{ marginTop: '0.5px' }}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-white">{label}</span>}
          {description && <span className="text-xs text-gray-400 mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
}
