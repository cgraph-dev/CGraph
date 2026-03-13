/**
 * QRCodeScanner Component
 *
 * Camera-based QR code scanner for verifying safety numbers.
 * Uses expo-camera to scan QR codes and compare them against
 * a locally known safety number.
 *
 * @module components/chat/QRCodeScanner
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QRCodeScannerProps {
  /** The locally computed safety number to compare against */
  expectedSafetyNumber: string;
  /** Called when a QR code is scanned — receives match result */
  onScanResult: (result: { matched: boolean; scannedValue: string }) => void;
  /** Called when user dismisses the scanner */
  onClose: () => void;
}

type VerificationResult = 'pending' | 'matched' | 'mismatched';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * QR code scanner for safety number verification.
 *
 * Opens the camera with barcode scanning mode, then compares the scanned
 * QR payload against the expected safety number.
 */
export function QRCodeScanner({ expectedSafetyNumber, onScanResult, onClose }: QRCodeScannerProps) {
  const { colors } = useThemeStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<VerificationResult>('pending');
  const [_scannedData, setScannedData] = useState<string | null>(null);
  const hasScannedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showResult = useCallback(
    (matched: boolean, value: string) => {
      setResult(matched ? 'matched' : 'mismatched');
      setScannedData(value);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      onScanResult({ matched, scannedValue: value });
    },
    [fadeAnim, onScanResult]
  );

  /**
   * Extract the safety number from a scanned QR payload.
   * Supports both raw 60-digit strings and JSON payloads from the web dialog.
   */
  const extractSafetyNumber = (raw: string): string | null => {
    // Try JSON payload first (from web dialog's buildQRPayload)
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.safetyNumber && typeof parsed.safetyNumber === 'string') {
        return parsed.safetyNumber;
      }
    } catch {
      // Not JSON — fall through
    }

    // Raw numeric string (digits only)
    const digits = raw.replace(/\s/g, '');
    if (/^\d{60}$/.test(digits)) {
      return digits;
    }

    return null;
  };

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (hasScannedRef.current) return;
      hasScannedRef.current = true;

      const scannedNumber = extractSafetyNumber(data);
      if (!scannedNumber) {
        showResult(false, data);
        return;
      }

      const matched = scannedNumber === expectedSafetyNumber;
      showResult(matched, scannedNumber);
    },
    [expectedSafetyNumber, showResult]
  );

  // Permission not determined yet
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Requesting camera permission…
        </Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Camera access is needed to scan QR codes
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Result overlay
  if (result !== 'pending') {
    const isMatch = result === 'matched';
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
          <Ionicons
            name={isMatch ? 'checkmark-circle' : 'warning'}
            size={64}
            color={isMatch ? '#22c55e' : '#ef4444'}
          />
          <Text style={[styles.resultTitle, { color: isMatch ? '#22c55e' : '#ef4444' }]}>
            {isMatch ? 'Verified ✓' : "Numbers Don't Match"}
          </Text>
          <Text style={[styles.resultDescription, { color: colors.textSecondary }]}>
            {isMatch
              ? "The safety numbers match. This contact's identity is verified."
              : 'The scanned safety number does not match — this may not be your contact.'}
          </Text>
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: isMatch ? '#22c55e' : colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Camera scanner
  return (
    <View style={styles.scannerContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.scanTitle}>Scan Safety Number</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Scanning frame */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {/* Bottom instruction */}
        <Text style={styles.scanInstruction}>
          Point your camera at the QR code on your contact&apos;s device
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_SIZE = SCREEN_WIDTH * 0.65;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 14,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 80,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 4,
  },
  scanTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scanFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  scanInstruction: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  resultContainer: {
    alignItems: 'center',
    padding: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  doneButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRCodeScanner;
