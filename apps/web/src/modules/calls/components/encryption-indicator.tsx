/**
 * Encryption Indicator
 *
 * Visual indicator for E2EE status on voice/video calls.
 * Shows a lock icon with color coding based on encryption state.
 *
 * - Green lock: E2EE active
 * - Amber lock with "!": Degraded / partial encryption
 * - Gray lock: E2EE not available
 *
 * @module modules/calls/components/encryption-indicator
 * @version 1.0.0
 */

import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EncryptionStatus = 'enabled' | 'degraded' | 'disabled';

interface EncryptionIndicatorProps {
  /** Current encryption status */
  status: EncryptionStatus;
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show label text alongside icon */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------

const sizeClasses = {
  sm: { icon: 'h-3.5 w-3.5', text: 'text-xs', container: 'gap-1 px-1.5 py-0.5' },
  md: { icon: 'h-4 w-4', text: 'text-sm', container: 'gap-1.5 px-2 py-1' },
  lg: { icon: 'h-5 w-5', text: 'text-base', container: 'gap-2 px-2.5 py-1.5' },
} as const;

const statusConfig = {
  enabled: {
    icon: LockClosedIcon,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    label: 'Encrypted',
    tooltip: 'This call is end-to-end encrypted',
  },
  degraded: {
    icon: LockClosedIcon,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'Partially Encrypted',
    tooltip: 'Encryption is degraded — some participants may not be encrypted',
  },
  disabled: {
    icon: LockOpenIcon,
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    label: 'Not Encrypted',
    tooltip: 'This call is not end-to-end encrypted',
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Encryption status indicator for call UIs.
 *
 * @example
 * ```tsx
 * <EncryptionIndicator status="enabled" />
 * <EncryptionIndicator status="degraded" size="sm" showLabel />
 * ```
 */
export function EncryptionIndicator({
  status,
  size = 'md',
  showLabel = false,
  className = '',
}: EncryptionIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeClasses[size];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.border} ${sizes.container} ${className}`}
      title={config.tooltip}
      role="status"
      aria-label={config.tooltip}
    >
      <div className="relative">
        <Icon className={`${sizes.icon} ${config.color}`} />
        {status === 'degraded' && (
          <ExclamationTriangleIcon
            className="absolute -right-1 -top-1 h-2.5 w-2.5 text-amber-400"
          />
        )}
      </div>
      {showLabel && (
        <span className={`${sizes.text} ${config.color} font-medium`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export default EncryptionIndicator;
