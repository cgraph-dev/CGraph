/**
 * Haptic Feedback — Unified haptic utility with settings awareness
 *
 * Wraps expo-haptics with setting checks and graceful fallback.
 *
 * @module components/ui/haptic-feedback
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// ── Settings Check ─────────────────────────────────────────────────────

let hapticsEnabled = true;

/** Call this to update haptics preference from user settings */
export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

function canHaptic(): boolean {
  // Only iOS guaranteed; Android varies by device
  return hapticsEnabled && Platform.OS !== 'web';
}

// ── Haptic Functions ───────────────────────────────────────────────────

/** Light tap — for button presses, toggles, selections */
function light() {
  if (!canHaptic()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium impact — for context menus, swipe actions, drag-drop */
function medium() {
  if (!canHaptic()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Heavy impact — for destructive actions (delete, leave) */
function heavy() {
  if (!canHaptic()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Success notification — for positive confirmations (message sent, saved) */
function success() {
  if (!canHaptic()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning notification — for alerts, errors that need attention */
function warning() {
  if (!canHaptic()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** Selection changed — for picker scroll, option selection */
function selection() {
  if (!canHaptic()) return;
  Haptics.selectionAsync();
}

// ── Export ──────────────────────────────────────────────────────────────

export const haptic = {
  light,
  medium,
  heavy,
  success,
  warning,
  selection,
} as const;

export default haptic;
