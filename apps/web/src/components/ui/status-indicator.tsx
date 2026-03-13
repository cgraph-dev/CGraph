/**
 * StatusIndicator — standalone status dot for use outside Avatar context.
 * @module
 */
import { cn } from '@/lib/utils';

type StatusType = 'online' | 'offline' | 'idle' | 'dnd' | 'streaming';

interface StatusIndicatorProps {
  status: StatusType;
  /** Show pulse animation for online status */
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
  streaming: 'bg-purple-500',
};

const sizeStyles = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

/**
 * StatusIndicator — a colored dot representing user presence state.
 */
export function StatusIndicator({
  status,
  pulse = false,
  size = 'md',
  className,
}: StatusIndicatorProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <span className={cn('rounded-full', sizeStyles[size], statusStyles[status])} />
      {pulse && status === 'online' && (
        <span
          className={cn(
            'absolute inset-0 animate-ping rounded-full bg-green-500 opacity-40',
            sizeStyles[size]
          )}
        />
      )}
    </span>
  );
}

export default StatusIndicator;
