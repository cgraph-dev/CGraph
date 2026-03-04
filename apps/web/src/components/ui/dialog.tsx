/**
 * Dialog Component
 *
 * Modal dialog for displaying content that requires user attention.
 */

import { ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { durationsSec } from '@/lib/animation-presets';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * unknown for the ui module.
 */
/**
 * Dialog dialog component.
 */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const reducedMotion = useReducedMotion();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            key="dialog-backdrop"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={reducedMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: durationsSec.normal }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            key="dialog-content"
            className="relative z-50"
            initial={reducedMotion ? undefined : { opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={
              reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }
            }
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Dialog Content dialog component.
 */
export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div
      className={`bg-surface border-surfaceBorder animate-in fade-in-0 zoom-in-95 mx-4 w-full max-w-md rounded-lg border p-6 shadow-xl ${className} `}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Dialog Header component.
 */
export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Dialog Title dialog component.
 */
export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return <h2 className={`text-textPrimary text-lg font-semibold ${className}`}>{children}</h2>;
}

export interface DialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Dialog Description dialog component.
 */
export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
  return <p className={`text-textMuted mt-1 text-sm ${className}`}>{children}</p>;
}

export interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Dialog Footer component.
 */
export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return <div className={`mt-6 flex justify-end gap-3 ${className}`}>{children}</div>;
}

export default Dialog;
