/**
 * SecretChatHeader
 *
 * Replaces the regular DM header when secret mode is active.
 * Layout: ← 🔒 Secret  [👻 Ghost]  [⏱ 24h]  [💣]  [⋮]
 *
 * @module modules/secret-chat/components/SecretChatHeader
 */

import { memo, useCallback } from 'react';
import { motion } from 'motion/react';
import { GhostModeIndicator } from './GhostModeIndicator';
import { TimerCountdown } from './TimerCountdown';
import { PanicWipeButton } from './PanicWipeButton';

/** Props for the SecretChatHeader component */
export interface SecretChatHeaderProps {
  /** Whether ghost mode is active */
  ghostModeActive: boolean;
  /** Whether ghost mode toggle is in progress */
  ghostModeToggling: boolean;
  /** Session expiry timestamp (ISO 8601) */
  expiresAt: string;
  /** Whether a panic wipe is in progress */
  isPanicWiping: boolean;
  /** Callback to navigate back */
  onBack: () => void;
  /** Callback to toggle ghost mode */
  onToggleGhost: () => void;
  /** Callback to trigger panic wipe */
  onPanicWipe: () => void;
  /** Callback when session expires */
  onExpired?: () => void;
  /** Callback to open menu */
  onMenuOpen?: () => void;
}

/**
 * Secret chat header bar with ghost mode, timer, panic wipe, and menu.
 * Renders a dark, secure-feeling header that replaces the normal DM header.
 */
export const SecretChatHeader = memo(function SecretChatHeader({
  ghostModeActive,
  ghostModeToggling,
  expiresAt,
  isPanicWiping,
  onBack,
  onToggleGhost,
  onPanicWipe,
  onExpired,
  onMenuOpen,
}: SecretChatHeaderProps) {
  const handleGhostToggle = useCallback(() => {
    onToggleGhost();
  }, [onToggleGhost]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 border-b border-white/5 bg-black/40 px-4 py-3 backdrop-blur-md"
    >
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Go back"
      >
        ←
      </button>

      {/* Lock icon + Secret label */}
      <div className="flex items-center gap-2">
        <span className="text-sm" role="img" aria-label="lock">🔒</span>
        <span className="text-sm font-semibold text-white">Secret</span>
      </div>

      {/* Ghost mode indicator / toggle */}
      <button
        type="button"
        onClick={handleGhostToggle}
        disabled={ghostModeToggling}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
          ghostModeActive
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
        }`}
        aria-label={ghostModeActive ? 'Deactivate ghost mode' : 'Activate ghost mode'}
      >
        <span role="img" aria-label="ghost">👻</span>
        <GhostModeIndicator
          isActive={ghostModeActive}
          isToggling={ghostModeToggling}
        />
        {!ghostModeActive && <span>Ghost</span>}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Timer countdown */}
      <TimerCountdown expiresAt={expiresAt} onExpired={onExpired} />

      {/* Panic wipe button */}
      <PanicWipeButton
        onWipe={onPanicWipe}
        isWiping={isPanicWiping}
      />

      {/* Menu button */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Open menu"
      >
        ⋮
      </button>
    </motion.header>
  );
});
