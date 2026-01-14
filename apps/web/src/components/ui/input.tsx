/**
 * Input Component
 * 
 * Text input field with various states and variants.
 */

import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-md
            bg-backgroundSunken border
            text-textPrimary placeholder-textMuted
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/50
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error 
              ? 'border-error focus:border-error' 
              : 'border-surfaceBorder focus:border-primary'
            }
            ${className}
          `}
          {...props}
        />
        {helperText && (
          <p className={`mt-1 text-xs ${error ? 'text-error' : 'text-textMuted'}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
