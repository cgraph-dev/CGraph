/**
 * XP Toast Component — Mobile
 *
 * Animated slide-in notification for real-time XP awards.
 * Queues multiple toasts, auto-dismisses after 2s.
 * Gold accent for coins, green for XP, yellow for level-up.
 *
 * Uses React Native Animated API for consistency with existing
 * gamification components (FloatingXPBadge, etc.).
 *
 * @module components/gamification/xp-toast
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────────────────

export type XPToastType = 'xp' | 'coins' | 'level_up' | 'cap_reached';

export interface XPToastData {
  id: string;
  type: XPToastType;
  amount: number;
  source?: string;
  message?: string;
}

interface XPToastProps {
  toasts: XPToastData[];
  onDismiss: (id: string) => void;
}

// ── Color config ───────────────────────────────────────────────────────

const TOAST_COLORS: Record<XPToastType, { bg: string; glow: string }> = {
  xp: { bg: '#059669', glow: '#10b981' },
  coins: { bg: '#b45309', glow: '#f59e0b' },
  level_up: { bg: '#7c3aed', glow: '#a78bfa' },
  cap_reached: { bg: '#991b1b', glow: '#ef4444' },
};

const TOAST_DURATION = 2000;

// ── Single Toast ───────────────────────────────────────────────────────

function SingleToast({
  data,
  index,
  onComplete,
}: {
  data: XPToastData;
  index: number;
  onComplete: () => void;
}) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Slide in from top
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 180,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -60,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => onComplete());
    }, TOAST_DURATION);

    return () => clearTimeout(dismissTimer);
  }, []);

  const colors = TOAST_COLORS[data.type];
  const topOffset = index * 64;

  const label =
    data.type === 'xp'
      ? `+${data.amount} XP`
      : data.type === 'coins'
        ? `+${data.amount} Coins`
        : data.type === 'level_up'
          ? `Level Up! 🎉`
          : 'Daily XP cap reached';

  const sourceLabel = data.source?.replace(/_/g, ' ') ?? '';

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.bg,
          shadowColor: colors.glow,
          top: topOffset,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Text style={styles.amountText}>{label}</Text>
        {sourceLabel ? (
          <Text style={styles.sourceText}>{sourceLabel}</Text>
        ) : null}
        {data.message ? (
          <Text style={styles.sourceText}>{data.message}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ── Toast Container ────────────────────────────────────────────────────

export default function XPToast({ toasts, onDismiss }: XPToastProps) {
  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.slice(0, 5).map((toast, i) => (
        <SingleToast
          key={toast.id}
          data={toast}
          index={i}
          onComplete={() => onDismiss(toast.id)}
        />
      ))}
    </View>
  );
}

// ── Hook for managing toast queue ──────────────────────────────────────

let toastCounter = 0;

export function useXPToastQueue() {
  const [toasts, setToasts] = useState<XPToastData[]>([]);

  const addToast = useCallback(
    (type: XPToastType, amount: number, source?: string, message?: string) => {
      const id = `xp-toast-${++toastCounter}-${Date.now()}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, amount, source, message }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    position: 'absolute',
    width: SCREEN_WIDTH - 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'column',
    gap: 2,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
