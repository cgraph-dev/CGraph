import React from 'react';

/**
 * OnlineStatusIndicator Component
 *
 * MyBB-style online status indicator showing:
 * - Online (green)
 * - Idle/Away (yellow)
 * - Do Not Disturb (red)
 * - Offline (gray)
 * - Invisible (hidden but shown to admins)
 */

export type OnlineStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';

interface OnlineStatusIndicatorProps {
  status: OnlineStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  lastActive?: string | null;
  className?: string;
}

const statusConfig: Record<OnlineStatus, { color: string; bgColor: string; label: string }> = {
  online: {
    color: 'bg-green-500',
    bgColor: 'bg-green-500/20',
    label: 'Online',
  },
  idle: {
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/20',
    label: 'Away',
  },
  dnd: {
    color: 'bg-red-500',
    bgColor: 'bg-red-500/20',
    label: 'Do Not Disturb',
  },
  offline: {
    color: 'bg-gray-400',
    bgColor: 'bg-gray-400/20',
    label: 'Offline',
  },
  invisible: {
    color: 'bg-gray-400',
    bgColor: 'bg-gray-400/20',
    label: 'Invisible',
  },
};

const sizeConfig = {
  xs: { dot: 'w-2 h-2', ring: 'w-3 h-3', text: 'text-xs' },
  sm: { dot: 'w-2.5 h-2.5', ring: 'w-4 h-4', text: 'text-xs' },
  md: { dot: 'w-3 h-3', ring: 'w-5 h-5', text: 'text-sm' },
  lg: { dot: 'w-4 h-4', ring: 'w-6 h-6', text: 'text-base' },
} as const;

export function OnlineStatusIndicator({
  status,
  size = 'md',
  showLabel = false,
  showTooltip = true,
  lastActive,
  className = '',
}: OnlineStatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size] ?? sizeConfig.md;

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const tooltipText =
    status === 'offline' && lastActive
      ? `${config.label} - Last seen ${formatLastActive(lastActive)}`
      : config.label;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={showTooltip ? tooltipText : undefined}
    >
      {/* Status Dot with Ring Animation for Online */}
      <div className="relative flex items-center justify-center">
        {status === 'online' && (
          <span
            className={`absolute ${sizeClass.ring} ${config.bgColor} animate-ping rounded-full opacity-75`}
          />
        )}
        <span className={`relative ${sizeClass.dot} ${config.color} rounded-full`} />
      </div>

      {/* Label */}
      {showLabel && (
        <span className={`${sizeClass.text} text-gray-600 dark:text-gray-400`}>{config.label}</span>
      )}
    </div>
  );
}

/**
 * OnlineStatusBadge Component
 *
 * Larger badge version showing status with optional last active time
 */
interface OnlineStatusBadgeProps {
  status: OnlineStatus;
  lastActive?: string | null;
  className?: string;
}

export function OnlineStatusBadge({ status, lastActive, className = '' }: OnlineStatusBadgeProps) {
  const config = statusConfig[status];

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `Active ${diffMins} min ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays < 7) return `Active ${diffDays} days ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${config.bgColor} ${className}`}
    >
      <span className={`h-2.5 w-2.5 ${config.color} rounded-full`} />
      <span
        className={`text-sm font-medium ${
          status === 'online'
            ? 'text-green-700 dark:text-green-300'
            : status === 'idle'
              ? 'text-yellow-700 dark:text-yellow-300'
              : status === 'dnd'
                ? 'text-red-700 dark:text-red-300'
                : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {status === 'offline' && lastActive ? formatLastActive(lastActive) : config.label}
      </span>
    </div>
  );
}

/**
 * OnlineStatusDropdown Component
 *
 * Dropdown menu for users to change their online status
 */
interface OnlineStatusDropdownProps {
  currentStatus: OnlineStatus;
  onChange: (status: OnlineStatus) => void;
  disabled?: boolean;
  className?: string;
}

export function OnlineStatusDropdown({
  currentStatus,
  onChange,
  disabled = false,
  className = '',
}: OnlineStatusDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableStatuses: OnlineStatus[] = ['online', 'idle', 'dnd', 'invisible'];

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <OnlineStatusIndicator status={currentStatus} size="sm" showTooltip={false} />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {statusConfig[currentStatus].label}
        </span>
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {availableStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                onChange(status);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${status === currentStatus ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
            >
              <OnlineStatusIndicator status={status} size="sm" showTooltip={false} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {statusConfig[status].label}
              </span>
              {status === currentStatus && (
                <svg
                  className="ml-auto h-4 w-4 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default OnlineStatusIndicator;
