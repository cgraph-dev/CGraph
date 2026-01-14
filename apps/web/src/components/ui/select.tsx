/**
 * Select Component
 * 
 * Dropdown select input.
 */

import { ReactNode, createContext, useContext, useState } from 'react';

export interface SelectProps {
  children: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
}

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

export function Select({ children, value: controlledValue, onValueChange, defaultValue = '', disabled = false }: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  
  const value = controlledValue ?? internalValue;
  const handleValueChange = (newValue: string) => {
    if (disabled) return;
    setInternalValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, isOpen, setIsOpen }}>
      <div className={`relative inline-block w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function SelectTrigger({ children, className = '', id }: SelectTriggerProps) {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('SelectTrigger must be used within Select');

  return (
    <button
      type="button"
      id={id}
      onClick={() => ctx.setIsOpen(!ctx.isOpen)}
      className={`
        w-full px-3 py-2 rounded-md
        bg-backgroundSunken border border-surfaceBorder
        text-textPrimary text-left
        flex items-center justify-between
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/50
        ${className}
      `}
    >
      {children}
      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('SelectValue must be used within Select');

  return <span className={!ctx.value ? 'text-textMuted' : ''}>{ctx.value || placeholder}</span>;
}

export interface SelectContentProps {
  children: ReactNode;
  className?: string;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('SelectContent must be used within Select');
  if (!ctx.isOpen) return null;

  return (
    <div
      className={`
        absolute top-full left-0 right-0 mt-1 z-50
        rounded-md bg-surface border border-surfaceBorder shadow-lg
        py-1 max-h-60 overflow-auto
        animate-in fade-in-0 zoom-in-95
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export interface SelectItemProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export function SelectItem({ children, value, className = '' }: SelectItemProps) {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('SelectItem must be used within Select');

  const isSelected = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={`
        w-full px-3 py-2 text-left
        text-textPrimary hover:bg-backgroundElevated
        transition-colors duration-150
        ${isSelected ? 'bg-primary/10 text-primary' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default Select;
