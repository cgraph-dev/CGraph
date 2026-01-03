/**
 * Biometric Authentication Utility
 * 
 * Provides secure biometric authentication (Face ID, Touch ID, Fingerprint)
 * for protecting sensitive operations like viewing encrypted messages,
 * accessing the app, or confirming transactions.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'cgraph_biometric_enabled';
const BIOMETRIC_LAST_AUTH_KEY = 'cgraph_biometric_last_auth';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
  securityLevel: 'none' | 'weak' | 'strong';
}

/**
 * Check biometric hardware and enrollment status
 */
export async function getBiometricStatus(): Promise<BiometricStatus> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    let biometricType: BiometricType = 'none';
    let securityLevel: 'none' | 'weak' | 'strong' = 'none';
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'facial';
      securityLevel = 'strong';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
      securityLevel = 'strong';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'iris';
      securityLevel = 'strong';
    }
    
    return {
      isAvailable: hasHardware,
      isEnrolled: isEnrolled,
      biometricType,
      securityLevel: hasHardware && isEnrolled ? securityLevel : 'none',
    };
  } catch (error) {
    console.error('Error checking biometric status:', error);
    return {
      isAvailable: false,
      isEnrolled: false,
      biometricType: 'none',
      securityLevel: 'none',
    };
  }
}

/**
 * Get user-friendly name for biometric type
 */
export function getBiometricName(type: BiometricType): string {
  switch (type) {
    case 'facial':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    case 'iris':
      return 'Iris Recognition';
    default:
      return 'Biometric';
  }
}

/**
 * Authenticate with biometrics
 */
export async function authenticateWithBiometrics(
  reason: string = 'Authenticate to continue'
): Promise<{ success: boolean; error?: string }> {
  try {
    const status = await getBiometricStatus();
    
    if (!status.isAvailable) {
      return { success: false, error: 'Biometric authentication not available on this device' };
    }
    
    if (!status.isEnrolled) {
      return { success: false, error: 'No biometrics enrolled. Please set up biometrics in your device settings.' };
    }
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      requireConfirmation: Platform.OS === 'android',
    });
    
    if (result.success) {
      // Store last authentication time
      await SecureStore.setItemAsync(
        BIOMETRIC_LAST_AUTH_KEY,
        Date.now().toString()
      );
      return { success: true };
    }
    
    return {
      success: false,
      error: result.error === 'user_cancel' 
        ? 'Authentication cancelled'
        : 'Authentication failed',
    };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Check if biometric lock is enabled by user
 */
export async function isBiometricLockEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable or disable biometric lock
 */
export async function setBiometricLockEnabled(enabled: boolean): Promise<boolean> {
  try {
    if (enabled) {
      // Verify biometrics work before enabling
      const result = await authenticateWithBiometrics('Verify biometrics to enable lock');
      if (!result.success) {
        return false;
      }
    }
    
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
    return true;
  } catch (error) {
    console.error('Error setting biometric lock:', error);
    return false;
  }
}

/**
 * Check if re-authentication is needed (based on timeout)
 * @param timeoutMs - Time in milliseconds after which re-auth is required (default: 5 minutes)
 */
export async function needsReauthentication(timeoutMs: number = 5 * 60 * 1000): Promise<boolean> {
  try {
    const enabled = await isBiometricLockEnabled();
    if (!enabled) {
      return false;
    }
    
    const lastAuthStr = await SecureStore.getItemAsync(BIOMETRIC_LAST_AUTH_KEY);
    if (!lastAuthStr) {
      return true;
    }
    
    const lastAuth = parseInt(lastAuthStr, 10);
    const now = Date.now();
    
    return now - lastAuth > timeoutMs;
  } catch {
    return true;
  }
}

/**
 * Request authentication if needed
 */
export async function requireAuthenticationIfNeeded(
  reason: string = 'Authenticate to access CGraph'
): Promise<{ success: boolean; error?: string }> {
  const needsAuth = await needsReauthentication();
  
  if (!needsAuth) {
    return { success: true };
  }
  
  return authenticateWithBiometrics(reason);
}

export default {
  getBiometricStatus,
  getBiometricName,
  authenticateWithBiometrics,
  isBiometricLockEnabled,
  setBiometricLockEnabled,
  needsReauthentication,
  requireAuthenticationIfNeeded,
};
