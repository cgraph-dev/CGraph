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

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { springs } from '@/lib/animation-presets/presets';

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

export function PresenceStatusSelector({
  currentStatus = 'online',
  onStatusChange,
  compact = false,
}: PresenceStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<PresenceStatus>(currentStatus);
  const [updating, setUpdating] = useState(false);

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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={updating}
        className={`flex items-center gap-2 rounded-lg transition-colors hover:bg-dark-700 ${
          compact ? 'p-1.5' : 'px-3 py-2'
        }`}
      >
        <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${currentOption.dotClass}`} />
        {!compact && (
          <span className="text-sm text-gray-300">{currentOption.label}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={springs.snappy}
              className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-gray-700/50 bg-dark-800 shadow-xl"
            >
              <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500">
                Set Status
              </div>
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-dark-700 ${
                    status === option.value ? 'bg-dark-700/50' : ''
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full shadow-sm ${option.dotClass}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                  {status === option.value && (
                    <span className="text-xs text-primary-400">✓</span>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
