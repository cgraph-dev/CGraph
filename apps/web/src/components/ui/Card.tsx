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
    interactive: 'hover:border-dark-600 hover:bg-dark-750 hover:shadow-card-hover transition-all duration-200 cursor-pointer',
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
    <div className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${animateStyles} ${className}`}>
      {children}
    </div>
  );
}

// Card Header component
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`border-b border-dark-700 pb-3 mb-3 ${className}`}>
      {children}
    </div>
  );
}

// Card Title component
interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function CardTitle({ children, className = '', as: Tag = 'h3' }: CardTitleProps) {
  return (
    <Tag className={`text-white font-semibold ${className}`}>
      {children}
    </Tag>
  );
}

// Card Content component
interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`text-gray-300 ${className}`}>
      {children}
    </div>
  );
}

// Card Footer component
interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`border-t border-dark-700 pt-3 mt-3 ${className}`}>
      {children}
    </div>
  );
}
