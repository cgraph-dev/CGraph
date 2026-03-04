/**
 * Styled text input component.
 * @module
 */
import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * Flexible input component with label, error, and icon support.
 */
export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  size = 'md',
  fullWidth = true,
  id,
  className = '',
  ref,
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const sizeStyles: Record<typeof size, string> = {
    sm: 'py-1.5 text-sm',
    md: 'py-2 text-sm',
    lg: 'py-3 text-base',
  };

  const paddingLeft = leftIcon ? 'pl-10' : 'pl-3';
  const paddingRight = rightIcon ? 'pr-10' : 'pr-3';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-white/70">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`block rounded-xl border shadow-sm transition-all duration-200 ${sizeStyles[size]} ${paddingLeft} ${paddingRight} ${fullWidth ? 'w-full' : ''} ${
            error
              ? 'border-red-500/60 text-red-400 placeholder-red-400/40 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.15),0_0_20px_rgba(239,68,68,0.08)] focus:ring-red-500/20'
              : 'focus:border-[var(--color-brand-purple)]/50 focus:ring-[var(--color-brand-purple)]/20 border-white/[0.08] bg-white/[0.04] text-white placeholder-white/30 hover:border-white/[0.15] focus:shadow-[0_0_0_2px_rgba(139,92,246,0.15),0_0_20px_rgba(139,92,246,0.08)] focus:ring-2'
          } focus:outline-none focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${className} `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

/**
 * Textarea component with label and error support.
 */
export function Textarea({
  label,
  error,
  hint,
  fullWidth = true,
  id,
  className = '',
  ref,
  ...props
}: TextareaProps & { ref?: React.Ref<HTMLTextAreaElement> }) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-white/70">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`block rounded-lg border px-3 py-2 text-sm shadow-sm ${fullWidth ? 'w-full' : ''} ${
          error
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:text-red-400'
            : 'border-white/[0.08] bg-white/[0.04] text-white focus:border-[var(--color-brand-purple)]/50 focus:ring-[var(--color-brand-purple)]/20'
        } min-h-[100px] resize-y focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-white/[0.02] disabled:opacity-50 ${className} `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${textareaId}-hint`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  fullWidth?: boolean;
}

/**
 * Select dropdown component with label and error support.
 */
export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  fullWidth = true,
  id,
  className = '',
  ref,
  ...props
}: SelectProps & { ref?: React.Ref<HTMLSelectElement> }) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-white/70">
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`block rounded-lg border px-3 py-2 text-sm shadow-sm ${fullWidth ? 'w-full' : ''} ${
          error
            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:text-red-400'
            : 'border-white/[0.08] bg-white/[0.04] text-white focus:border-[var(--color-brand-purple)]/50 focus:ring-[var(--color-brand-purple)]/20'
        } focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-white/[0.02] disabled:opacity-50 ${className} `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${selectId}-hint`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}

Select.displayName = 'Select';

export default Input;
