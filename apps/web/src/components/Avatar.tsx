

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  fallback?: string;
  className?: string;
}

/**
 * Avatar component with online status indicator and fallback support.
 */
export function Avatar({
  src,
  alt,
  size = 'md',
  status,
  fallback,
  className = '',
}: AvatarProps) {
  const sizeClasses: Record<typeof size, string> = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const statusSizeClasses: Record<typeof size, string> = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
    lg: 'w-3 h-3 bottom-0.5 right-0.5',
    xl: 'w-4 h-4 bottom-1 right-1',
  };

  const statusColors: Record<NonNullable<typeof status>, string> = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  // Generate initials from alt text
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate consistent color from name
  const getColorFromName = (name: string): string => {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length] ?? 'bg-indigo-500';
  };

  const initials = fallback || getInitials(alt);
  const bgColor = getColorFromName(alt);

  return (
    <div className={`relative inline-flex flex-shrink-0 group ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white dark:ring-gray-800 transition-transform duration-200 group-hover:scale-105`}
          onError={(e) => {
            // Hide broken image and show fallback
            e.currentTarget.style.display = 'none';
            const fallbackEl = e.currentTarget.nextElementSibling;
            if (fallbackEl) {
              (fallbackEl as HTMLElement).style.display = 'flex';
            }
          }}
        />
      ) : null}
      <div
        className={`${sizeClasses[size]} rounded-full ${bgColor} flex items-center justify-center text-white font-medium ring-2 ring-white dark:ring-gray-800`}
        style={{ display: src ? 'none' : 'flex' }}
        aria-hidden="true"
      >
        {initials}
      </div>
      {status && (
        <span
          className={`absolute ${statusSizeClasses[size]} ${statusColors[status]} rounded-full ring-2 ring-white dark:ring-gray-800`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ src?: string | null; alt: string }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * Group of overlapping avatars with overflow indicator.
 */
export function AvatarGroup({ avatars, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const overlapClasses: Record<typeof size, string> = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
  };

  const sizeClasses: Record<typeof size, string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div className="flex items-center">
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={index > 0 ? overlapClasses[size] : ''}
        >
          <Avatar src={avatar.src} alt={avatar.alt} size={size} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`${overlapClasses[size]} ${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium ring-2 ring-white dark:ring-gray-800`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

export default Avatar;
