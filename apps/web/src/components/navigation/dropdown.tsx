/**
 * Dropdown menu component.
 * @module
 */
import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Dropdown component.
 */
export default function Dropdown({
  trigger,
  children,
  align = 'left',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: align === 'right' ? rect.right : rect.left,
      });
    }
  }, [isOpen, align]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
         
        !dropdownRef.current.contains(e.target as Node) && // type assertion: EventTarget to Node for contains check
        triggerRef.current &&
         
        !triggerRef.current.contains(e.target as Node) // type assertion: EventTarget to Node for contains check
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`animate-scaleIn fixed z-50 min-w-[160px] origin-top rounded-lg border border-dark-600 bg-dark-800 py-1 shadow-xl ${className}`}
            style={{
              top: position.top,
              left: align === 'right' ? 'auto' : position.left,
              right: align === 'right' ? window.innerWidth - position.left : 'auto',
            }}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

function getDropdownItemClass(disabled: boolean | undefined, danger: boolean | undefined): string {
  if (disabled) {
    return 'text-gray-600 cursor-not-allowed';
  }
  if (danger) {
    return 'text-red-400 hover:bg-red-500/10';
  }
  return 'text-gray-200 hover:bg-dark-700';
}

/**
 * unknown for the navigation module.
 */
/**
 * Dropdown Item component.
 */
export function DropdownItem({ children, onClick, icon, danger, disabled }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${getDropdownItemClass(disabled, danger)}`}
    >
      {icon && <span className="h-4 w-4">{icon}</span>}
      {children}
    </button>
  );
}

/**
 * unknown for the navigation module.
 */
/**
 * Dropdown Divider component.
 */
export function DropdownDivider() {
  return <div className="my-1 border-t border-dark-600" />;
}
