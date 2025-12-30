import { ReactNode } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  badge?: ReactNode;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

/**
 * Avatar - A user avatar component with fallback to initials.
 */
export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
  badge,
  status,
}: AvatarProps) {
  const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
    xs: { container: 'h-6 w-6', text: 'text-[10px]', status: 'h-2 w-2' },
    sm: { container: 'h-8 w-8', text: 'text-xs', status: 'h-2.5 w-2.5' },
    md: { container: 'h-10 w-10', text: 'text-sm', status: 'h-3 w-3' },
    lg: { container: 'h-12 w-12', text: 'text-base', status: 'h-3.5 w-3.5' },
    xl: { container: 'h-16 w-16', text: 'text-xl', status: 'h-4 w-4' },
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Generate a consistent color based on name
  const getColorFromName = (name: string) => {
    const colors = [
      'bg-red-600',
      'bg-orange-600',
      'bg-amber-600',
      'bg-yellow-600',
      'bg-lime-600',
      'bg-green-600',
      'bg-emerald-600',
      'bg-teal-600',
      'bg-cyan-600',
      'bg-sky-600',
      'bg-blue-600',
      'bg-indigo-600',
      'bg-violet-600',
      'bg-purple-600',
      'bg-fuchsia-600',
      'bg-pink-600',
      'bg-rose-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeStyles[size].container} rounded-full overflow-hidden flex items-center justify-center ${
          !src ? getColorFromName(name) : 'bg-dark-600'
        }`}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`font-semibold text-white ${sizeStyles[size].text}`}>
            {getInitials(name)}
          </span>
        )}
      </div>

      {/* Status indicator */}
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${sizeStyles[size].status} rounded-full ${statusColors[status]} ring-2 ring-dark-800`}
        />
      )}

      {/* Badge */}
      {badge && (
        <span className="absolute -top-1 -right-1">
          {badge}
        </span>
      )}
    </div>
  );
}

// Avatar group component
interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({ children, max = 5, size = 'md' }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleAvatars = childArray.slice(0, max);
  const overflowCount = childArray.length - max;

  const overlapStyles: Record<AvatarSize, string> = {
    xs: '-ml-2',
    sm: '-ml-2.5',
    md: '-ml-3',
    lg: '-ml-4',
    xl: '-ml-5',
  };

  return (
    <div className="flex items-center">
      {visibleAvatars.map((child, index) => (
        <div
          key={index}
          className={`relative ring-2 ring-dark-800 rounded-full ${index > 0 ? overlapStyles[size] : ''}`}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          {child}
        </div>
      ))}
      {overflowCount > 0 && (
        <div
          className={`${overlapStyles[size]} relative ring-2 ring-dark-800 rounded-full`}
          style={{ zIndex: 0 }}
        >
          <Avatar name={`+${overflowCount}`} size={size} />
        </div>
      )}
    </div>
  );
}
