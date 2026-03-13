/**
 * SafetyNumberScreen
 *
 * Full-screen view for verifying end-to-end encryption with a contact.
 * Displays a 60-digit safety number in Signal's 4×3 grid format,
 * a QR code for cross-device verification, and a QR scanner.
 *
 * @module screens/chat/safety-number-screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemeStore } from '@/stores';
import { useE2EE } from '../../lib/crypto/e2-ee-context';
import api from '../../lib/api';
import { QRCodeScanner } from '../../components/chat/qr-code-scanner';
import type { MessagesStackParamList } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<MessagesStackParamList, 'SafetyNumber'>;

interface VerificationState {
  safetyNumber: string | null;
  isVerified: boolean;
  loading: boolean;
  verifying: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Split a 60-digit safety number into 12 groups of 5 digits. */
function splitSafetyNumber(number: string): string[] {
  return number.match(/.{1,5}/g) ?? [];
}

/** Build QR code payload matching the web dialog format. */
function buildQRPayload(userId: string, safetyNumber: string): string {
  return JSON.stringify({
    version: 1,
    type: 'cgraph-verify',
    userId,
    safetyNumber,
    timestamp: Date.now(),
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Safety Number Screen component. */
export default function SafetyNumberScreen({ route, navigation }: Props) {
  const { recipientId, recipientName } = route.params;
  const { colors } = useThemeStore();
  const { getSafetyNumber } = useE2EE();
  const [showScanner, setShowScanner] = useState(false);

  const [state, setState] = useState<VerificationState>({
    safetyNumber: null,
    isVerified: false,
    loading: true,
    verifying: false,
    error: null,
  });

  // ── Fetch safety number ──────────────────────────────────────────
  const fetchSafetyNumber = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      const safetyNumber = await getSafetyNumber(recipientId);

      // Check if already verified
      let isVerified = false;
      try {
        const verifyRes = await api.get(`/api/v1/e2ee/keys/${recipientId}/verification-status`);
        isVerified = verifyRes.data?.data?.verified ?? false;
      } catch {
        // Endpoint may not exist yet — treat as unverified
      }

      setState({
        safetyNumber,
        isVerified,
        loading: false,
        verifying: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load safety number';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [recipientId, getSafetyNumber]);

  useEffect(() => {
    fetchSafetyNumber();
  }, [fetchSafetyNumber]);

  // ── Header ───────────────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      title: `Verify ${recipientName}`,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (state.safetyNumber) {
              import('expo-clipboard').then(({ setStringAsync }) => {
                setStringAsync(state.safetyNumber!);
                Alert.alert('Copied', 'Safety number copied to clipboard');
              });
            }
          }}
          style={{ marginRight: 8 }}
        >
          <Ionicons name="copy-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, recipientName, state.safetyNumber, colors]);

  // ── Mark as verified ─────────────────────────────────────────────
  const handleMarkVerified = async () => {
    try {
      setState((s) => ({ ...s, verifying: true, error: null }));
      await api.post(`/api/v1/e2ee/keys/${recipientId}/verify`);
      setState((s) => ({ ...s, isVerified: true, verifying: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark as verified';
      setState((s) => ({ ...s, verifying: false, error: message }));
    }
  };

  // ── QR scan result ───────────────────────────────────────────────
  const handleScanResult = useCallback(
    ({ matched }: { matched: boolean; scannedValue: string }) => {
      if (matched) {
        Alert.alert('Verified ✓', "The safety numbers match. This contact's identity is verified.");
      }
    },
    []
  );

  // ── Scanner mode ─────────────────────────────────────────────────
  if (showScanner && state.safetyNumber) {
    return (
      <QRCodeScanner
        expectedSafetyNumber={state.safetyNumber}
        onScanResult={handleScanResult}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  const groups = state.safetyNumber ? splitSafetyNumber(state.safetyNumber) : [];

  // ── Loading state ────────────────────────────────────────────────
  if (state.loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading safety number…
        </Text>
      </View>
    );
  }

  // ── Error state ──────────────────────────────────────────────────
  if (state.error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="warning-outline" size={48} color="#eab308" />
        <Text style={[styles.errorText, { color: colors.text }]}>{state.error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.surface }]}
          onPress={fetchSafetyNumber}
        >
          <Text style={[styles.retryButtonText, { color: colors.text }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main content ─────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Verified badge */}
      {state.isVerified && (
        <View style={[styles.verifiedBadge, { borderColor: 'rgba(34,197,94,0.3)' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
          <Text style={styles.verifiedText}>Identity Verified</Text>
        </View>
      )}

      {/* Description */}
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Compare the safety number below with {recipientName}&apos;s screen to verify end-to-end
        encryption.
      </Text>

      {/* Safety number grid — 4 rows × 3 columns */}
      <View
        style={[
          styles.numberCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border ?? 'rgba(255,255,255,0.1)',
          },
        ]}
      >
        <Text style={[styles.numberLabel, { color: colors.textSecondary }]}>SAFETY NUMBER</Text>
        <View style={styles.numberGrid}>
          {groups.map((group, i) => (
            <Text key={i} style={[styles.numberGroup, { color: colors.text }]} selectable>
              {group}
            </Text>
          ))}
        </View>
      </View>

      {/* QR code */}
      <View style={styles.qrContainer}>
        <View style={styles.qrBackground}>
          <QRCode
            value={buildQRPayload(recipientId, state.safetyNumber!)}
            size={200}
            backgroundColor="#fff"
            color="#000"
          />
        </View>
        <Text style={[styles.qrCaption, { color: colors.textSecondary }]}>
          Ask your contact to scan this code, or compare the numbers above
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowScanner(true)}
        >
          <Ionicons name="scan-outline" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>Scan Code</Text>
        </TouchableOpacity>

        {!state.isVerified && (
          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: '#16a34a' }]}
            onPress={handleMarkVerified}
            disabled={state.verifying}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
            <Text style={styles.verifyButtonText}>
              {state.verifying ? 'Verifying…' : 'Mark as Verified'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  verifiedText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  numberCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  numberLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  numberGroup: {
    width: (SCREEN_WIDTH - 80) / 3,
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: 16,
    letterSpacing: 2,
    paddingVertical: 4,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrBackground: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
  },
  qrCaption: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 32,
  },
  actions: {
    gap: 12,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
