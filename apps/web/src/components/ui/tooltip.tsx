/**
 * Tooltip — Discord-style compact dark tooltip with arrow.
 * @module
 */
import { ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { durationsSec } from '@/lib/animation-presets';

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: ReactNode;
  content: string;
  /** @deprecated use `side` instead */
  position?: TooltipSide;
  side?: TooltipSide;
  delay?: number;
  className?: string;
}

/**
 * Tooltip — compact dark background with arrow, 300ms hover delay.
 */
export default function Tooltip({
  children,
  content,
  position,
  side,
  delay = 300,
  className,
}: TooltipProps) {
  const resolvedSide = side ?? position ?? 'top';
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let x = 0, y = 0;

        switch (resolvedSide) {
          case 'top':
            x = rect.left + rect.width / 2;
            y = rect.top - 8;
            break;
          case 'bottom':
            x = rect.left + rect.width / 2;
            y = rect.bottom + 8;
            break;
          case 'left':
            x = rect.left - 8;
            y = rect.top + rect.height / 2;
            break;
          case 'right':
            x = rect.right + 8;
            y = rect.top + rect.height / 2;
            break;
        }

        setCoords({ x, y });
        setIsVisible(true);
      }
    }, delay);
  }, [delay, resolvedSide]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getTransformClass = () => {
    switch (resolvedSide) {
      case 'top':    return '-translate-x-1/2 -translate-y-full';
      case 'bottom': return '-translate-x-1/2';
      case 'left':   return '-translate-x-full -translate-y-1/2';
      case 'right':  return '-translate-y-1/2';
      default:       return '';
    }
  };

  const arrowClasses: Record<TooltipSide, string> = {
    top: 'left-1/2 -translate-x-1/2 -bottom-1 border-l-transparent border-r-transparent border-b-transparent border-t-[rgb(24,24,32)]',
    bottom: 'left-1/2 -translate-x-1/2 -top-1 border-l-transparent border-r-transparent border-t-transparent border-b-[rgb(24,24,32)]',
    left: 'top-1/2 -translate-y-1/2 -right-1 border-t-transparent border-b-transparent border-r-transparent border-l-[rgb(24,24,32)]',
    right: 'top-1/2 -translate-y-1/2 -left-1 border-t-transparent border-b-transparent border-l-transparent border-r-[rgb(24,24,32)]',
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: durationsSec.fast }}
              className={`pointer-events-none fixed z-[var(--z-tooltip,700)] ${getTransformClass()} ${className ?? ''}`}
              style={{ left: coords.x, top: coords.y }}
            >
              <div className="relative rounded-md bg-[rgb(24,24,32)] px-2.5 py-1.5 text-xs font-medium text-white shadow-lg border border-white/[0.06]">
                {content}
                {/* Arrow */}
                <span
                  className={`absolute h-0 w-0 border-4 ${arrowClasses[resolvedSide]}`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
