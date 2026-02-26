/**
 * Label Component
 * 
 * Form label with optional required indicator.
 */

import { LabelHTMLAttributes, ReactNode } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
}

/**
 * unknown for the ui module.
 */
/**
 * Label component.
 */
export function Label({ children, required = false, className = '', ...props }: LabelProps) {
  return (
    <label
      className={`
        block text-sm font-medium text-textPrimary mb-1.5
        ${className}
      `}
      {...props}
    >
      {children}
      {required && <span className="text-error ml-1">*</span>}
    </label>
  );
}

export default Label;
