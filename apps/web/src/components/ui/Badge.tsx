import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
  icon?: ReactNode;
}

/**
 * Badge - A small status indicator component.
 * 
 * Use for labels, tags, status indicators, counts.
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
  icon,
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-dark-600 text-gray-300',
    primary: 'bg-primary-600/20 text-primary-400 border border-primary-500/30',
    success: 'bg-green-600/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30',
    danger: 'bg-red-600/20 text-red-400 border border-red-500/30',
    info: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-gray-400',
    primary: 'bg-primary-400',
    success: 'bg-green-400',
    warning: 'bg-yellow-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {icon}
      {children}
    </span>
  );
}

// Predefined badge variants for common use cases
export function NewBadge({ className = '' }: { className?: string }) {
  return <Badge variant="success" size="sm" className={className}>New</Badge>;
}

export function HotBadge({ className = '' }: { className?: string }) {
  return <Badge variant="danger" size="sm" className={className}>🔥 Hot</Badge>;
}

export function NsfwBadge({ className = '' }: { className?: string }) {
  return <Badge variant="danger" size="sm" className={className}>NSFW</Badge>;
}

export function PinnedBadge({ className = '' }: { className?: string }) {
  return <Badge variant="success" size="sm" className={className}>📌 Pinned</Badge>;
}

export function PrivateBadge({ className = '' }: { className?: string }) {
  return <Badge variant="warning" size="sm" className={className}>🔒 Private</Badge>;
}

export function PublicBadge({ className = '' }: { className?: string }) {
  return <Badge variant="info" size="sm" className={className}>🌐 Public</Badge>;
}

export function OwnerBadge({ className = '' }: { className?: string }) {
  return <Badge variant="primary" size="sm" className={className}>👑 Owner</Badge>;
}

export function ModeratorBadge({ className = '' }: { className?: string }) {
  return <Badge variant="success" size="sm" className={className}>🛡️ Mod</Badge>;
}

export function MemberBadge({ className = '' }: { className?: string }) {
  return <Badge variant="default" size="sm" className={className}>Member</Badge>;
}

export function CountBadge({ count, className = '' }: { count: number; className?: string }) {
  const displayCount = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();
  return <Badge variant="default" size="sm" className={className}>{displayCount}</Badge>;
}
