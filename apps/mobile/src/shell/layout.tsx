/**
 * Biometric Lock Gate — wraps the entire app and shows a lock overlay
 * when biometric re-authentication is needed after returning to foreground.
 *
 * The overlay renders ABOVE all navigators/screens so that no content is
 * visible until the user authenticates.
 *
 * @module app/_layout
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AppState,
  type AppStateStatus,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  requireAuthenticationIfNeeded,
  isBiometricLockEnabled,
  authenticateWithBiometrics,
  getBiometricStatus,
} from '../lib/biometrics';

interface BiometricGateProps {
  children: React.ReactNode;
}

/**
 * Wraps children with an AppState-driven biometric lock overlay.
 *
 * On every `active` transition (foreground) the component:
 * 1. Checks whether biometric lock is enabled
 * 2. Calls `requireAuthenticationIfNeeded` (respects the 5-min timeout in biometrics.ts)
 * 3. Shows a full-screen lock overlay if authentication fails or is required
 */
export default function BiometricGate({ children }: BiometricGateProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const attemptUnlock = useCallback(async () => {
    // Skip if device has no biometric capability
    const status = await getBiometricStatus();
    if (!status.isAvailable || !status.isEnrolled) {
      setIsLocked(false);
      return;
    }

    const enabled = await isBiometricLockEnabled();
    if (!enabled) {
      setIsLocked(false);
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await requireAuthenticationIfNeeded('Unlock CGraph');
      if (result.success) {
        setIsLocked(false);
      } else {
        // Auth failed or was cancelled — keep overlay visible
        setIsLocked(true);
      }
    } catch {
      setIsLocked(true);
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const handleManualUnlock = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      const result = await authenticateWithBiometrics('Unlock CGraph');
      if (result.success) {
        setIsLocked(false);
      }
    } catch {
      // Keep locked
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // Only trigger when transitioning TO active (foreground)
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        void attemptUnlock();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [attemptUnlock]);

  return (
    <View style={styles.root}>
      {children}
      {isLocked && (
        <BiometricLockOverlay isAuthenticating={isAuthenticating} onUnlock={handleManualUnlock} />
      )}
    </View>
  );
}

// ── Lock Overlay ─────────────────────────────────────────────────────────────

interface LockOverlayProps {
  isAuthenticating: boolean;
  onUnlock: () => void;
}

function BiometricLockOverlay({ isAuthenticating, onUnlock }: LockOverlayProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.lockContent}>
        <Ionicons name="lock-closed" size={56} color="#10b981" />
        <Text style={styles.lockTitle}>CGraph is Locked</Text>
        <Text style={styles.lockSubtitle}>Authenticate to continue</Text>

        {isAuthenticating ? (
          <ActivityIndicator size="large" color="#10b981" style={styles.unlockButton} />
        ) : (
          <TouchableOpacity style={styles.unlockButton} onPress={onUnlock} activeOpacity={0.7}>
            <Ionicons name="finger-print" size={28} color="#fff" />
            <Text style={styles.unlockButtonText}>Tap to Unlock</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  lockContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
  },
  lockSubtitle: {
    color: '#9ca3af',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 40,
    gap: 10,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
