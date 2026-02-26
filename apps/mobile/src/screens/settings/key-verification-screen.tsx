/**
 * E2EE Key Verification Screen for Mobile
 *
 * Displays safety number for verifying end-to-end encryption with a contact.
 * Includes QR code scanning for cross-device verification.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import api from '../../lib/api';

interface RouteParams {
  userId: string;
  username: string;
}

interface VerificationState {
  safetyNumber: string | null;
  isVerified: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Format safety number into human-readable groups
 */
function formatSafetyNumber(number: string): string {
  return number.match(/.{1,5}/g)?.join(' ') || number;
}

/**
 * Generate QR code data for cross-device verification
 */
function getQRData(userId: string, safetyNumber: string): string {
  return JSON.stringify({
    version: 1,
    type: 'cgraph-verify',
    userId,
    safetyNumber,
    timestamp: Date.now(),
  });
}

/**
 *
 */
export function KeyVerificationScreen() {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const _navigation = useNavigation();
  const { userId, username } = route.params;

  const [state, setState] = useState<VerificationState>({
    safetyNumber: null,
    isVerified: false,
    loading: true,
    error: null,
  });
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchSafetyNumber();
  }, [userId]);

  const fetchSafetyNumber = async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));

      const response = await api.get(`/api/v1/e2ee/safety-number/${userId}`);
      const { safety_number } = response.data.data;

      // Check if already verified
      let isVerified = false;
      try {
        const verifyResponse = await api.get(`/api/v1/e2ee/keys/${userId}/verification-status`);
        isVerified = verifyResponse.data.data?.verified || false;
      } catch {
        // Verification status endpoint may not exist yet
      }

      setState({
        safetyNumber: safety_number,
        isVerified,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setState((s) => ({
        ...s,
        loading: false,
        error: error?.response?.data?.message || 'Failed to load safety number',
      }));
    }
  };

  const handleMarkVerified = async () => {
    Alert.alert(
      'Confirm Verification',
      `Have you verified that ${username}'s safety number matches yours?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Mark Verified',
          onPress: async () => {
            try {
              await api.post(`/api/v1/e2ee/keys/${userId}/verify`);
              setState((s) => ({ ...s, isVerified: true }));
              Alert.alert('Success', `${username} is now verified!`);
            } catch (err: unknown) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const error = err as any;
              Alert.alert('Error', error?.response?.data?.message || 'Failed to mark as verified');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!state.safetyNumber) return;

    try {
      await Share.share({
        message: `CGraph Safety Number with ${username}:\n\n${formatSafetyNumber(
          state.safetyNumber
        )}\n\nCompare this number in the CGraph app to verify end-to-end encryption.`,
      });
    } catch (_err) {
      // User cancelled
    }
  };

  if (state.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading security info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#f59e0b" />
          <Text style={styles.errorTitle}>Verification Unavailable</Text>
          <Text style={styles.errorMessage}>{state.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSafetyNumber}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formattedNumber = formatSafetyNumber(state.safetyNumber || '');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              state.isVerified ? styles.iconVerified : styles.iconDefault,
            ]}
          >
            <Ionicons
              name={state.isVerified ? 'shield-checkmark' : 'shield-outline'}
              size={32}
              color={state.isVerified ? '#10b981' : '#6366f1'}
            />
          </View>
          <Text style={styles.title}>Verify Security</Text>
          <Text style={styles.subtitle}>with {username}</Text>
        </View>

        {/* Verified Badge */}
        {state.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to verify:</Text>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>
              Compare the safety number below with {username}'s number
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>
              Do this in person, via video call, or another trusted channel
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>If they match, tap "Mark as Verified"</Text>
          </View>
        </View>

        {/* Safety Number Display */}
        <View style={styles.safetyNumberCard}>
          <Text style={styles.safetyNumberLabel}>SAFETY NUMBER</Text>
          <Text style={styles.safetyNumber} selectable>
            {formattedNumber}
          </Text>
        </View>

        {/* QR Code Section */}
        <TouchableOpacity style={styles.qrToggle} onPress={() => setShowQR(!showQR)}>
          <Ionicons name={showQR ? 'chevron-up' : 'qr-code-outline'} size={20} color="#6366f1" />
          <Text style={styles.qrToggleText}>{showQR ? 'Hide QR Code' : 'Show QR Code'}</Text>
        </TouchableOpacity>

        {showQR && state.safetyNumber && (
          <View style={styles.qrContainer}>
            <QRCode
              value={getQRData(userId, state.safetyNumber)}
              size={200}
              backgroundColor="white"
              color="black"
            />
            <Text style={styles.qrHint}>Scan with CGraph app to verify instantly</Text>
          </View>
        )}

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#6366f1" />
          <Text style={styles.shareButtonText}>Share Safety Number</Text>
        </TouchableOpacity>

        {/* Verify Button */}
        {!state.isVerified && (
          <TouchableOpacity style={styles.verifyButton} onPress={handleMarkVerified}>
            <Ionicons name="shield-checkmark" size={20} color="white" />
            <Text style={styles.verifyButtonText}>Mark as Verified</Text>
          </TouchableOpacity>
        )}

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons name="alert-circle-outline" size={16} color="#f59e0b" />
          <Text style={styles.warningText}>
            If the numbers don't match, your messages may be intercepted. Do not verify until you've
            confirmed they match.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconDefault: {
    backgroundColor: '#e0e7ff',
  },
  iconVerified: {
    backgroundColor: '#d1fae5',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  verifiedText: {
    color: '#059669',
    fontWeight: '600',
    marginLeft: 6,
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  instructionNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e7ff',
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginRight: 10,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  safetyNumberCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  safetyNumberLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 1,
    marginBottom: 8,
  },
  safetyNumber: {
    fontFamily: 'monospace',
    fontSize: 18,
    color: '#1f2937',
    letterSpacing: 2,
    textAlign: 'center',
  },
  qrToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  qrToggleText: {
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 8,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  qrHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  shareButtonText: {
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 8,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  verifyButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default KeyVerificationScreen;
