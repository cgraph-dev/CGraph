/**
 * HoloModal Component
 * @version 4.0.0
 */

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { HoloPreset, getTheme } from './types';
import { HoloContainer } from './holo-container';
import { HoloText } from './holo-text';
import { springs } from '@/lib/animation-presets';

interface HoloModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  preset?: HoloPreset;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  className?: string;
}

/**
 * unknown for the enhanced module.
 */
/**
 * Holo Modal dialog component.
 */
export function HoloModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  preset = 'cyan',
  size = 'md',
  closeOnOverlay = true,
  className,
}: HoloModalProps) {
  const theme = getTheme(preset);

  const sizeStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw] max-h-[90vh]',
  };

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlay ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={springs.stiff}
            className={cn('relative w-full', sizeStyles[size], className)}
          >
            <HoloContainer preset={preset} className="overflow-hidden">
              {/* Header */}
              {title && (
                <div
                  className="flex items-center justify-between border-b px-6 py-4"
                  style={{ borderColor: theme.border }}
                >
                  <HoloText variant="subtitle" preset={preset}>
                    {title}
                  </HoloText>
                  <motion.button
                    onClick={onClose}
                    className="rounded-lg p-2 transition-colors"
                    style={{ color: theme.textMuted }}
                    whileHover={{ scale: 1.1, color: theme.text }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </motion.button>
                </div>
              )}

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto px-6 py-4">{children}</div>

              {/* Footer */}
              {footer && (
                <div
                  className="flex justify-end gap-3 border-t px-6 py-4"
                  style={{ borderColor: theme.border }}
                >
                  {footer}
                </div>
              )}
            </HoloContainer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
