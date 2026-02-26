/** Card — reusable card container with variant, padding, and animation options. */
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'interactive' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animate?: boolean;
}

/**
 * Card - A reusable card component with consistent styling.
 *
 * Variants:
 * - default: Basic card with border
 * - interactive: Adds hover effects for clickable cards
 * - elevated: More prominent shadow
 */
export default function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  animate = false,
}: CardProps) {
  const baseStyles = 'rounded-lg bg-dark-800 border border-dark-700';

  const variantStyles = {
    default: '',
    interactive:
      'hover:border-dark-600 hover:bg-dark-750 hover:shadow-card-hover transition-all duration-200 cursor-pointer',
    elevated: 'shadow-card border-dark-600',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const animateStyles = animate ? 'animate-fade-in-up' : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${animateStyles} ${className}`}
    >
      {children}
    </div>
  );
}

// Card Header component
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Card Header display component.
 */
export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`mb-3 border-b border-dark-700 pb-3 ${className}`}>{children}</div>;
}

// Card Title component
interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

/**
 * unknown for the ui module.
 */
/**
 * Card Title display component.
 */
export function CardTitle({ children, className = '', as: Tag = 'h3' }: CardTitleProps) {
  return <Tag className={`font-semibold text-white ${className}`}>{children}</Tag>;
}

// Card Content component
interface CardContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Card Content display component.
 */
export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`text-gray-300 ${className}`}>{children}</div>;
}

// Card Footer component
interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Card Footer display component.
 */
export function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={`mt-3 border-t border-dark-700 pt-3 ${className}`}>{children}</div>;
}

// Card Description component
interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Card Description display component.
 */
export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return <p className={`text-sm text-gray-400 ${className}`}>{children}</p>;
}
