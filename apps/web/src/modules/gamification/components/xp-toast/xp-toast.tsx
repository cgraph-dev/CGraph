/**
 * XP Toast Component
 *
 * Animated floating "+15 XP" indicator with green glow effect.
 * Uses CSS translateY + opacity animation with 2s auto-dismiss.
 * Stacks multiple toasts vertically.
 * Includes daily cap progress bar.
 *
 * @module modules/gamification/components/xp-toast
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useXPAwarded, useCapReached } from '../../hooks/useGamificationSocket';
import type { XPAwardedEvent, CapReachedEvent } from '../../hooks/gamification-socket.types';

// ── Types ──────────────────────────────────────────────────────────────

interface XPToastItem {
  id: string;
  amount: number;
  source: string;
  levelUp: boolean;
  dailyUsed: number;
  dailyLimit: number;
  createdAt: number;
}

const TOAST_DURATION = 2000;
const MAX_VISIBLE_TOASTS = 5;

// ── Styles ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    position: 'fixed' as const,
    top: '80px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    pointerEvents: 'none' as const,
  },
  toast: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: '10px',
    padding: '10px 16px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '14px',
    minWidth: '180px',
    backdropFilter: 'blur(8px)',
    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
  },
  toastEnter: {
    transform: 'translateY(-20px)',
    opacity: 0,
  },
  toastVisible: {
    transform: 'translateY(0)',
    opacity: 1,
  },
  toastExit: {
    transform: 'translateY(-10px)',
    opacity: 0,
  },
  levelUp: {
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))',
    boxShadow: '0 0 24px rgba(245, 158, 11, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  capWarning: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(185, 28, 28, 0.9))',
    boxShadow: '0 0 20px rgba(239, 68, 68, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3)',
    fontWeight: 500 as const,
    fontSize: '12px',
  },
  amount: {
    fontSize: '18px',
    fontWeight: 800,
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
  },
  source: {
    fontSize: '11px',
    opacity: 0.85,
    fontWeight: 500,
  },
  progressBar: {
    width: '100%',
    height: '3px',
    borderRadius: '2px',
    background: 'rgba(255,255,255,0.2)',
    marginTop: '4px',
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    borderRadius: '2px',
    background: 'rgba(255,255,255,0.7)',
    transition: 'width 0.3s ease-out',
  },
};

// ── Single Toast Item ──────────────────────────────────────────────────

function XPToastItem({
  toast,
  onRemove,
}: {
  toast: XPToastItem;
  onRemove: (id: string) => void;
}) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Enter → visible
    const enterTimer = setTimeout(() => setPhase('visible'), 50);
    // Start exit
    timerRef.current = setTimeout(() => setPhase('exit'), TOAST_DURATION);
    return () => {
      clearTimeout(enterTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === 'exit') {
      const removeTimer = setTimeout(() => onRemove(toast.id), 300);
      return () => clearTimeout(removeTimer);
    }
    return undefined;
  }, [phase, toast.id, onRemove]);

  const phaseStyle =
    phase === 'enter'
      ? styles.toastEnter
      : phase === 'exit'
        ? styles.toastExit
        : styles.toastVisible;

  const capPercent = toast.dailyLimit > 0
    ? Math.min((toast.dailyUsed / toast.dailyLimit) * 100, 100)
    : 0;

  const sourceLabel = toast.source.replace(/_/g, ' ');

  return (
    <div
      style={{
        ...styles.toast,
        ...(toast.levelUp ? styles.levelUp : {}),
        ...phaseStyle,
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={styles.amount}>+{toast.amount} XP</span>
          {toast.levelUp && <span>🎉 Level Up!</span>}
        </div>
        <div style={styles.source}>{sourceLabel}</div>
        {toast.dailyLimit > 0 && (
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${capPercent}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cap Reached Toast ──────────────────────────────────────────────────

function CapReachedToast({ onRemove }: { onRemove: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('visible'), 50);
    const exitTimer = setTimeout(() => setPhase('exit'), 3000);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  useEffect(() => {
    if (phase === 'exit') {
      const t = setTimeout(onRemove, 300);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, onRemove]);

  const phaseStyle =
    phase === 'enter'
      ? styles.toastEnter
      : phase === 'exit'
        ? styles.toastExit
        : styles.toastVisible;

  return (
    <div style={{ ...styles.toast, ...styles.capWarning, ...phaseStyle }}>
      Daily XP cap reached — take a break!
    </div>
  );
}

// ── Main Container ─────────────────────────────────────────────────────

export default function XPToastContainer() {
  const [toasts, setToasts] = useState<XPToastItem[]>([]);
  const [showCapWarning, setShowCapWarning] = useState(false);
  const idCounter = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleXPAwarded = useCallback((data: XPAwardedEvent) => {
    if (data.amount <= 0) return;

    const id = `xp-${++idCounter.current}-${Date.now()}`;
    const newToast: XPToastItem = {
      id,
      amount: data.amount,
      source: data.source,
      levelUp: data.level_up,
      dailyUsed: data.daily_cap_status?.used ?? 0,
      dailyLimit: data.daily_cap_status?.limit ?? 0,
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev.slice(-MAX_VISIBLE_TOASTS + 1), newToast]);
  }, []);

  const handleCapReached = useCallback((_data: CapReachedEvent) => {
    setShowCapWarning(true);
  }, []);

  useXPAwarded(handleXPAwarded);
  useCapReached(handleCapReached);

  return (
    <div style={styles.container}>
      {toasts.map((toast) => (
        <XPToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
      {showCapWarning && (
        <CapReachedToast onRemove={() => setShowCapWarning(false)} />
      )}
    </div>
  );
}
