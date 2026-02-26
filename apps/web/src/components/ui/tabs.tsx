/**
 * Tabs Component
 * 
 * Tabbed navigation for switching between content panels.
 */

import { ReactNode, createContext, use, useState } from 'react';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  children: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Tabs component.
 */
export function Tabs({ 
  children, 
  value: controlledValue, 
  onValueChange, 
  defaultValue = '',
  className = '' 
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const value = controlledValue ?? internalValue;
  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Tabs List component.
 */
export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div 
      role="tablist"
      className={`
        inline-flex items-center gap-1 p-1 rounded-lg
        bg-backgroundSunken
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  children: ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}

/**
 * unknown for the ui module.
 */
/**
 * Tabs Trigger component.
 */
export function TabsTrigger({ children, value, className = '', disabled = false }: TabsTriggerProps) {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');

  const isSelected = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => ctx.onValueChange(value)}
      className={`
        px-3 py-1.5 text-sm font-medium rounded-md
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isSelected 
          ? 'bg-surface text-textPrimary shadow-sm' 
          : 'text-textMuted hover:text-textPrimary hover:bg-surface/50'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  children: ReactNode;
  value: string;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Tabs Content component.
 */
export function TabsContent({ children, value, className = '' }: TabsContentProps) {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');

  if (ctx.value !== value) return null;

  return (
    <div 
      role="tabpanel"
      className={`mt-4 ${className}`}
    >
      {children}
    </div>
  );
}

export default Tabs;
