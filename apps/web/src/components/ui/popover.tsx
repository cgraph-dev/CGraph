/**
 * Popover Component
 *
 * Floating panel for contextual content.
 */

import React, { ReactNode, createContext, use, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

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

/**
 * unknown for the ui module.
 */
/**
 * Popover component.
 */
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

/**
 * unknown for the ui module.
 */
/**
 * Popover Trigger component.
 */
export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const ctx = use(PopoverContext);

  const handleClick = () => {
    ctx?.setIsOpen(!ctx.isOpen);
  };

  if (asChild && React.isValidElement(children)) {
     
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: handleClick,
    });
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

/**
 * unknown for the ui module.
 */
/**
 * Popover Content component.
 */
export function PopoverContent({
  children,
  className = '',
  align = 'center',
  sideOffset = 4,
}: PopoverContentProps) {
  const ctx = use(PopoverContext);
  const reducedMotion = useReducedMotion();

  const alignClass = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }[align];

  return (
    <AnimatePresence>
      {ctx?.isOpen && (
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={
            reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }
          }
          className={`absolute top-full mt-${sideOffset} z-50 ${alignClass} min-w-[200px] rounded-xl border border-white/[0.10] p-4 shadow-card backdrop-blur-xl ${className} `}
          style={{
            background: 'rgba(13, 17, 23, 0.92)',
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Popover;
