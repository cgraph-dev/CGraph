/**
 * Popover Component
 * 
 * Floating panel for contextual content.
 */

import React, { ReactNode, createContext, use, useState } from 'react';

interface PopoverContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

export interface PopoverProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = (open: boolean) => {
    setInternalOpen(open);
    onOpenChange?.(open);
  };

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

export interface PopoverTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const ctx = use(PopoverContext);
  
  const handleClick = () => {
    ctx?.setIsOpen(!ctx.isOpen);
  };
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: handleClick });
  }
  return (
    <button type="button" onClick={handleClick} className="inline-flex">
      {children}
    </button>
  );
}

export interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export function PopoverContent({ 
  children, 
  className = '',
  align = 'center',
  sideOffset = 4 
}: PopoverContentProps) {
  const ctx = use(PopoverContext);
  
  if (!ctx?.isOpen) return null;
  
  const alignClass = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }[align];

  return (
    <div
      className={`
        absolute top-full mt-${sideOffset} z-50
        ${alignClass}
        min-w-[200px] rounded-lg
        bg-surface border border-surfaceBorder shadow-lg
        p-4 animate-in fade-in-0 zoom-in-95
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Popover;
