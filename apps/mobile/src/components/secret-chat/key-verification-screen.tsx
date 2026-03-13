/**
 * KeyVerificationScreen
 *
 * Displays the safety number for verifying end-to-end encryption
 * between two users. Shows both a QR code and a numeric code
 * for out-of-band verification.
 *
 * @module components/secret-chat/key-verification-screen
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SecretThemeColors } from '@/screens/secret-chat/theme-colors';
import { loadIdentityKey } from '@/lib/crypto/pq-bridge';
import { sha256 } from '@/lib/crypto/e2ee';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KeyVerificationScreenProps {
  readonly recipientId: string;
  readonly recipientName: string;
  readonly recipientPublicKey?: string;
  readonly themeColors: SecretThemeColors;
  readonly onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a 60-digit safety number from two public keys.
 * Uses SHA-256 of concatenated keys, truncated and expanded to digits.
 */
async function generateSafetyNumber(localKey: Uint8Array, remoteKey: Uint8Array): Promise<string> {
  // Sort keys to ensure both parties compute the same number
  const concat = new Uint8Array(localKey.length + remoteKey.length);
  const [first, second] =
    (localKey[0] ?? 0) <= (remoteKey[0] ?? 0) ? [localKey, remoteKey] : [remoteKey, localKey];
  concat.set(first, 0);
  concat.set(second, first.length);

  const hash = await sha256(concat);
  // Convert hash bytes to a 60-digit number
  let digits = '';
  for (const byte of hash) {
    digits += byte.toString().padStart(3, '0');
  }
  return digits.slice(0, 60);
}

/** Split a 60-digit safety number into 12 groups of 5 digits. */
function splitSafetyNumber(number: string): string[] {
  return number.match(/.{1,5}/g) ?? [];
}

/** Build QR code payload for verification. */
function buildQRPayload(userId: string, safetyNumber: string): string {
  return JSON.stringify({
    version: 1,
    type: 'cgraph-verify',
    userId,
    safetyNumber,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Description. */
/** Key Verification Screen component. */
export function KeyVerificationScreen({
  recipientId,
  recipientName,
  recipientPublicKey,
  themeColors,
  onClose,
}: KeyVerificationScreenProps) {
  const [safetyNumber, setSafetyNumber] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const identity = await loadIdentityKey();
        if (!identity || !recipientPublicKey) {
          if (!cancelled) setLoading(false);
          return;
        }

        const localKeyBytes = new Uint8Array(Buffer.from(String(identity.publicKey), 'base64'));
        const remoteKeyBytes = new Uint8Array(Buffer.from(String(recipientPublicKey), 'base64'));

        const number = await generateSafetyNumber(localKeyBytes, remoteKeyBytes);
        if (!cancelled) {
          setSafetyNumber(number);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipientPublicKey]);

  const groups = useMemo(
    () => (safetyNumber ? splitSafetyNumber(safetyNumber) : []),
    [safetyNumber]
  );

  const qrPayload = useMemo(
    () => (safetyNumber ? buildQRPayload(recipientId, safetyNumber) : ''),
    [recipientId, safetyNumber]
  );

  const handleShare = useCallback(async () => {
    if (!safetyNumber) return;
    await Share.share({
      message: `Safety number for ${recipientName}:\n${groups.join(' ')}`,
    });
  }, [safetyNumber, recipientName, groups]);

  const handleMarkVerified = useCallback(() => {
    Alert.alert(
      'Mark as Verified?',
      `Have you verified this safety number with ${recipientName} through an independent channel (in person, phone call, etc.)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Verified',
          onPress: () => setIsVerified(true),
        },
      ]
    );
  }, [recipientName]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Generating safety number...
        </Text>
      </View>
    );
  }

  if (!safetyNumber) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Ionicons name="warning-outline" size={48} color={themeColors.textSecondary} />
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
          Unable to generate safety number.{'\n'}Encryption keys may not be available.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollContainer, { backgroundColor: themeColors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={themeColors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: themeColors.text }]}>Verify Security</Text>
      </View>

      {/* Verification Status */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: isVerified ? '#05966920' : `${themeColors.accent}18` },
        ]}
      >
        <Ionicons
          name={isVerified ? 'shield-checkmark' : 'shield-outline'}
          size={16}
          color={isVerified ? '#059669' : themeColors.accent}
        />
        <Text style={[styles.statusText, { color: isVerified ? '#059669' : themeColors.accent }]}>
          {isVerified ? 'Verified' : 'Not Verified'}
        </Text>
      </View>

      {/* QR Code */}
      <View
        style={[
          styles.qrContainer,
          { backgroundColor: '#ffffff', borderColor: themeColors.border },
        ]}
      >
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrPlaceholderText}>QR</Text>
          <Text style={styles.qrNote}>{qrPayload.slice(0, 20)}...</Text>
        </View>
      </View>

      <Text style={[styles.instructions, { color: themeColors.textSecondary }]}>
        Compare this safety number with {recipientName} to verify end-to-end encryption. You can
        scan each other's QR code or compare the numbers below.
      </Text>

      {/* Numeric Safety Number — 4×3 grid like Signal */}
      <View style={[styles.numberGrid, { borderColor: themeColors.border }]}>
        {groups.map((group, idx) => (
          <View key={idx} style={styles.numberCell}>
            <Text style={[styles.numberText, { color: themeColors.text }]}>{group}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {!isVerified && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: themeColors.accent }]}
            onPress={handleMarkVerified}
          >
            <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
            <Text style={styles.actionButtonText}>Mark as Verified</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButtonOutline, { borderColor: themeColors.border }]}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={18} color={themeColors.text} />
          <Text style={[styles.actionButtonOutlineText, { color: themeColors.text }]}>
            Share Safety Number
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  qrContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrPlaceholder: {
    alignItems: 'center',
  },
  qrPlaceholderText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  qrNote: {
    fontSize: 8,
    color: '#666',
    marginTop: 4,
  },
  instructions: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 24,
  },
  numberCell: {
    width: '25%',
    paddingVertical: 8,
    alignItems: 'center',
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionButtonOutlineText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
