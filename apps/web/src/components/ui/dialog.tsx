/**
 * Dialog Component
 * 
 * Modal dialog for displaying content that requires user attention.
 */

import { ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  }, [onOpenChange]);

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

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>,
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
      className={`
        bg-surface border border-surfaceBorder rounded-lg shadow-xl
        max-w-md w-full mx-4 p-6
        animate-in fade-in-0 zoom-in-95
        ${className}
      `}
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
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
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
  return (
    <h2 className={`text-lg font-semibold text-textPrimary ${className}`}>
      {children}
    </h2>
  );
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
  return (
    <p className={`text-sm text-textMuted mt-1 ${className}`}>
      {children}
    </p>
  );
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
  return (
    <div className={`mt-6 flex justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}

export default Dialog;
