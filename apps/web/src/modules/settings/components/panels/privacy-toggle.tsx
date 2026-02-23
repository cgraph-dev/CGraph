/** @module Reusable privacy toggle switch sub-component. */

interface PrivacyToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}

/**
 * A labelled toggle switch used in privacy settings panels.
 */
export function PrivacyToggle({
  label,
  description,
  checked,
  disabled,
  onToggle,
}: PrivacyToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium text-white">{label}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-dark-600'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <span
          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
