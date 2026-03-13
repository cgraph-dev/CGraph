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
    <label className={`text-textPrimary mb-1.5 block text-sm font-medium ${className} `} {...props}>
      {children}
      {required && <span className="ml-1 text-error">*</span>}
    </label>
  );
}

export default Label;
