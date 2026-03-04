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
  className = '',
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const value = controlledValue ?? internalValue;
  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
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
      className={`inline-flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.06] p-1 backdrop-blur-[12px] dark:bg-[rgb(30,32,40)]/60 ${className} `}
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
export function TabsTrigger({
  children,
  value,
  className = '',
  disabled = false,
}: TabsTriggerProps) {
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
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        isSelected
          ? 'bg-white/[0.10] text-white shadow-[inset_0_0.5px_0_rgba(255,255,255,0.06)] backdrop-blur-sm dark:bg-white/[0.08]'
          : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
      } ${className} `}
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
    <div role="tabpanel" className={`mt-4 ${className}`}>
      {children}
    </div>
  );
}

export default Tabs;
