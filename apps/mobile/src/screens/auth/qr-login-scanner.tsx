/**
 * QR Login Scanner Screen
 *
 * Camera-based QR code scanner for cross-device authentication.
 * Scans a QR code displayed on the web app, verifies the server,
 * and sends an HMAC-SHA256 signed approval to authenticate the web session.
 *
 * @module screens/auth/qr-login-scanner
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { useAuthStore, useThemeStore } from '@/stores';
import api, { API_URL } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QrLoginScannerProps = {
  navigation: NativeStackNavigationProp<Record<string, undefined>>;
};

type ScanState = 'scanning' | 'confirming' | 'approving' | 'success' | 'error';

interface QrPayload {
  sid: string;
  ch: string;
  srv: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

// ---------------------------------------------------------------------------
// HMAC Helper
// ---------------------------------------------------------------------------

/**
 * Compute HMAC-SHA256(challenge, userId) and return URL-safe Base64.
 *
 * Uses expo-crypto's digest with a manual HMAC construction
 * (key XOR'd with ipad/opad) since expo-crypto doesn't have native HMAC.
 */
async function computeHmacSignature(challenge: string, userId: string): Promise<string> {
  // expo-crypto has digestStringAsync but not HMAC directly.
  // We implement HMAC-SHA256(key, message) manually:
  // HMAC(K, m) = H((K' ⊕ opad) || H((K' ⊕ ipad) || m))

  const key = userId;
  const message = challenge;

  // For simplicity, compute using a string-concat approach that the backend
  // can verify. The backend uses :crypto.mac(:hmac, :sha256, to_string(user_id), challenge).
  // We need to produce the same output.

  // Build key bytes (pad to 64 bytes for SHA-256 block size)
  const keyBytes = new Uint8Array(64);
  const encoder = new TextEncoder();
  const keyEncoded = encoder.encode(key);

  if (keyEncoded.length > 64) {
    // Hash the key if it's longer than block size
    const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key, {
      encoding: Crypto.CryptoEncoding.HEX,
    });
    const hashedBytes = hexToBytes(hashed);
    keyBytes.set(hashedBytes);
  } else {
    keyBytes.set(keyEncoded);
  }

  // ipad = key XOR 0x36, opad = key XOR 0x5c
  const ipad = new Uint8Array(64);
  const opad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    ipad[i] = keyBytes[i] ^ 0x36;
    opad[i] = keyBytes[i] ^ 0x5c;
  }

  // Inner hash: SHA256(ipad || message)
  const innerData = concatUint8Arrays(ipad, encoder.encode(message));
  const innerHashHex = await digestBytes(innerData);
  const innerHashBytes = hexToBytes(innerHashHex);

  // Outer hash: SHA256(opad || innerHash)
  const outerData = concatUint8Arrays(opad, innerHashBytes);
  const hmacHex = await digestBytes(outerData);

  // Convert hex to URL-safe base64 (matching Elixir's Base.url_encode64(padding: false))
  const hmacBytes = hexToBytes(hmacHex);
  return bytesToUrlSafeBase64(hmacBytes);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

async function digestBytes(data: Uint8Array): Promise<string> {
  // Convert to base64 for expo-crypto
  const base64 = bytesToBase64(data);
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, base64, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function bytesToUrlSafeBase64(bytes: Uint8Array): string {
  const b64 = bytesToBase64(bytes);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** QR login scanner screen for mobile-to-web authentication. */
export default function QrLoginScannerScreen({ navigation }: QrLoginScannerProps) {
  const { colors } = useThemeStore();
  const { user, token } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [payload, setPayload] = useState<QrPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasScannedRef = useRef(false);

  // ── Handle QR code scan ────────────────────────────────────────────

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (hasScannedRef.current || scanState !== 'scanning') return;
      hasScannedRef.current = true;

      try {
        // Decode Base64 payload
        const decoded = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
        const parsed: QrPayload = JSON.parse(decoded);

        if (!parsed.sid || !parsed.ch || !parsed.srv) {
          throw new Error('Invalid QR payload');
        }

        // Validate server URL matches expected backend
        const expectedOrigin = API_URL.replace(/\/$/, '');
        const scannedOrigin = parsed.srv.replace(/\/$/, '');

        if (scannedOrigin !== expectedOrigin) {
          Alert.alert(
            'Unknown Server',
            `This QR code is from a different server (${parsed.srv}). For security, only your configured server is supported.`,
            [{ text: 'OK', onPress: () => resetScanner() }]
          );
          return;
        }

        setPayload(parsed);
        setScanState('confirming');
      } catch {
        Alert.alert('Invalid QR Code', 'This QR code is not a valid CGraph login code.', [
          { text: 'OK', onPress: () => resetScanner() },
        ]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scanState]
  );

  // ── Approve login ──────────────────────────────────────────────────

  const approveLogin = useCallback(async () => {
    if (!payload || !user || !token) return;

    setScanState('approving');

    try {
      // Compute HMAC-SHA256(challenge, user_id)
      const signature = await computeHmacSignature(payload.ch, String(user.id));

      await api.post('/api/v1/auth/qr-login', {
        session_id: payload.sid,
        signature,
      });

      setScanState('success');

      // Navigate back after brief success feedback
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: unknown) {
      const message =
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to approve login. Please try again.';
      setErrorMessage(message);
      setScanState('error');
    }
  }, [payload, user, token, navigation]);

  // ── Reset scanner ──────────────────────────────────────────────────

  const resetScanner = useCallback(() => {
    hasScannedRef.current = false;
    setPayload(null);
    setErrorMessage(null);
    setScanState('scanning');
  }, []);

  // ── Permission handling ────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Camera access is needed to scan QR codes
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Auth check ─────────────────────────────────────────────────────

  if (!user || !token) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={[styles.permissionText, { color: colors.text }]}>
          You must be logged in to approve QR logins
        </Text>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Scan QR to Login</Text>
        <View style={styles.backButton} />
      </View>

      {/* Camera / State views */}
      {scanState === 'scanning' && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarCodeScanned}
          >
            {/* Overlay with scanning area */}
            <View style={styles.overlay}>
              <View style={[styles.scanArea, { borderColor: colors.primary }]}>
                <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                <View
                  style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]}
                />
              </View>
            </View>
          </CameraView>
          <Text style={[styles.instructions, { color: colors.textSecondary }]}>
            Point your camera at the QR code on the web login page
          </Text>
        </View>
      )}

      {/* Confirmation dialog */}
      {scanState === 'confirming' && (
        <View style={styles.confirmContainer}>
          <Ionicons name="desktop-outline" size={64} color={colors.primary} />
          <Text style={[styles.confirmTitle, { color: colors.text }]}>Log in to CGraph Web?</Text>
          <Text style={[styles.confirmSubtitle, { color: colors.textSecondary }]}>
            You are approving a login for {user.username || user.email} on the web app.
          </Text>
          <TouchableOpacity
            style={[styles.approveButton, { backgroundColor: colors.primary }]}
            onPress={approveLogin}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.approveButtonText}>Approve Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={resetScanner}>
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Approving state */}
      {scanState === 'approving' && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.text }]}>Approving login...</Text>
        </View>
      )}

      {/* Success state */}
      {scanState === 'success' && (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success ?? '#22c55e'} />
          <Text style={[styles.statusText, { color: colors.text }]}>Login approved!</Text>
          <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
            The web session is now authenticated.
          </Text>
        </View>
      )}

      {/* Error state */}
      {scanState === 'error' && (
        <View style={styles.statusContainer}>
          <Ionicons name="close-circle" size={64} color={colors.error} />
          <Text style={[styles.statusText, { color: colors.text }]}>Login Failed</Text>
          <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
            {errorMessage}
          </Text>
          <TouchableOpacity
            style={[styles.approveButton, { backgroundColor: colors.primary }]}
            onPress={resetScanner}
          >
            <Text style={styles.approveButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 3,
  },
  topLeft: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  instructions: {
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    fontSize: 14,
  },
  confirmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
    width: '80%',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 14,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
  },
  statusSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
