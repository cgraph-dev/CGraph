/**
 * DisappearingMessagesToggle - Settings toggle for ephemeral messages
 * Sets message TTL for a conversation
 */

import { useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface DisappearingMessagesToggleProps {
  conversationId: string;
  currentTTL: number | null; // seconds, null = off
  onUpdate: (ttl: number | null) => void;
}

const TTL_OPTIONS = [
  { label: 'Off', value: null },
  { label: '24 hours', value: 86400 },
  { label: '7 days', value: 604800 },
  { label: '30 days', value: 2592000 },
] as const;

/**
 * unknown for the chat module.
 */
/**
 * Disappearing Messages Toggle component.
 */
export function DisappearingMessagesToggle({
  conversationId: _conversationId,
  currentTTL,
  onUpdate,
}: DisappearingMessagesToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = TTL_OPTIONS.find((o) => o.value === currentTTL) || TTL_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white/80 transition-colors"
      >
        <ClockIcon className="h-4 w-4" />
        <span>Disappearing: {currentOption.label}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full right-0 z-50 mb-2 w-48 rounded-xl border border-white/10 bg-white/[0.04] py-1 shadow-xl">
            <p className="px-3 py-2 text-xs font-semibold uppercase text-white/30">
              Message timer
            </p>
            {TTL_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  onUpdate(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-white/5 ${
                  currentTTL === option.value ? 'text-primary-400' : 'text-white/70'
                }`}
              >
                <span>{option.label}</span>
                {currentTTL === option.value && <span className="text-xs">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
