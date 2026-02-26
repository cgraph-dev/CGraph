/**
 * Alert Component
 * 
 * Display important messages to users.
 */

import { ReactNode } from 'react';

export type AlertVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'destructive';

export interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  default: 'bg-surface border-surfaceBorder text-textPrimary',
  success: 'bg-success/10 border-success/30 text-success',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  error: 'bg-error/10 border-error/30 text-error',
  info: 'bg-info/10 border-info/30 text-info',
  destructive: 'bg-error/10 border-error/30 text-error',
};

/**
 * unknown for the ui module.
 */
/**
 * Alert component.
 */
export function Alert({ children, variant = 'default', className = '' }: AlertProps) {
  return (
    <div
      role="alert"
      className={`
        p-4 rounded-lg border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export interface AlertDescriptionProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Alert Description component.
 */
export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
}

export interface AlertTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Alert Title component.
 */
export function AlertTitle({ children, className = '' }: AlertTitleProps) {
  return (
    <h4 className={`font-medium mb-1 ${className}`}>
      {children}
    </h4>
  );
}

export default Alert;
