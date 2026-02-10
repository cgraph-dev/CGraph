import React from 'react';
import { type OnlineStatus, statusConfig } from './types';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';

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
