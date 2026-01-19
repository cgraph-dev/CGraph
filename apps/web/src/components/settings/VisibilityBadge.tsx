import { EyeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface VisibilityBadgeProps {
  visible: 'others' | 'local';
  className?: string;
}

/**
 * VisibilityBadge - Indicates whether a customization is visible to other users or local only
 *
 * Usage:
 * ```tsx
 * <VisibilityBadge visible="others" /> // Visible to everyone
 * <VisibilityBadge visible="local" />  // Only visible on your device
 * ```
 */
export default function VisibilityBadge({ visible, className = '' }: VisibilityBadgeProps) {
  if (visible === 'others') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/30 ${className}`}
      >
        <EyeIcon className="h-3.5 w-3.5 text-primary-400" />
        <span className="text-xs font-medium text-primary-300">Visible to others</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 border border-gray-500/30 ${className}`}
    >
      <DevicePhoneMobileIcon className="h-3.5 w-3.5 text-gray-400" />
      <span className="text-xs font-medium text-gray-300">Your device only</span>
    </div>
  );
}
