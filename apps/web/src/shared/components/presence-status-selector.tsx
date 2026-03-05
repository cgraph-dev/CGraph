/**
 * PresenceStatusSelector - Status picker for Online/Idle/DND/Invisible
 * @module shared/components
 *
 * Features:
 * - Online: Green dot, full notifications
 * - Idle: Yellow moon, reduced notifications
 * - DND: Red circle, suppress all notifications
 * - Invisible: Gray dot, appear offline to others
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import { springPreset, glassSurfaceElevated } from '@/components/liquid-glass/shared';

type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible';

interface StatusOption {
  value: PresenceStatus;
  label: string;
  description: string;
  color: string;
  dotClass: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'online',
    label: 'Online',
    description: 'You will appear online to others',
    color: 'bg-green-500',
    dotClass: 'bg-green-500 shadow-green-500/50',
  },
  {
    value: 'idle',
    label: 'Idle',
    description: 'You will appear as away',
    color: 'bg-yellow-500',
    dotClass: 'bg-yellow-500 shadow-yellow-500/50',
  },
  {
    value: 'dnd',
    label: 'Do Not Disturb',
    description: 'Suppress all notifications',
    color: 'bg-red-500',
    dotClass: 'bg-red-500 shadow-red-500/50',
  },
  {
    value: 'invisible',
    label: 'Invisible',
    description: 'Appear offline but stay connected',
    color: 'bg-gray-500',
    dotClass: 'bg-gray-500 shadow-gray-500/50',
  },
];

interface PresenceStatusSelectorProps {
  currentStatus?: PresenceStatus;
  onStatusChange?: (status: PresenceStatus) => void;
  compact?: boolean;
}

/**
 * unknown for the presence-status-selector.tsx module.
 */
/**
 * Presence Status Selector component.
 */
export function PresenceStatusSelector({
  currentStatus = 'online',
  onStatusChange,
  compact = false,
}: PresenceStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<PresenceStatus>(currentStatus);
  const [updating, setUpdating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.top,
        left: rect.right + 8,
      });
    }
  }, [isOpen]);

  const currentOption = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0]!;

  const handleSelect = async (newStatus: PresenceStatus) => {
    setStatus(newStatus);
    setIsOpen(false);
    setUpdating(true);
    try {
      await api.put('/api/v1/me', { status: newStatus });
      onStatusChange?.(newStatus);
    } catch {
      setStatus(status); // revert on failure
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={updating}
        className={`flex items-center gap-2 rounded-lg transition-colors hover:bg-white/[0.08] ${
          compact ? 'p-1.5' : 'px-3 py-2'
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${currentOption.dotClass}`} />
        {!compact && <span className="text-sm text-gray-300">{currentOption.label}</span>}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, x: -6, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -6, scale: 0.92 }}
                transition={springPreset}
                style={{ top: menuPos.top, left: menuPos.left }}
                className={`fixed z-[9999] w-56 overflow-hidden rounded-xl border border-white/[0.08] shadow-2xl shadow-black/40 ${glassSurfaceElevated}`}
              >
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Set Status
                </div>
                <div className="mx-2 mb-1 h-px bg-white/[0.06]" />
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 hover:bg-white/[0.08] ${
                      status === option.value ? 'bg-white/[0.06]' : ''
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${option.dotClass}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-200">{option.label}</div>
                      <div className="text-[11px] leading-tight text-gray-500">{option.description}</div>
                    </div>
                    {status === option.value && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xs text-primary-400"
                      >
                        ✓
                      </motion.span>
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
