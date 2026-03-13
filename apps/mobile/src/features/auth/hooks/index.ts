/**
 * Auth Hooks (Mobile)
 * 
 * Wraps AuthContext with additional features like biometrics and 2FA.
 * @module features/auth/hooks
 * @version 0.8.6
 */

import { useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '@/stores';
import api from '../../../lib/api';

/**
 * Hook for biometric authentication
 */
export function useBiometricAuth() {
  const checkBiometricSupport = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    return {
      isSupported: hasHardware && isEnrolled,
      supportedTypes,
    };
  }, []);
  
  const authenticate = useCallback(async (reason?: string) => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to continue',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      return result.success;
    } catch {
      return false;
    }
  }, []);
  
  return {
    checkBiometricSupport,
    authenticate,
  };
}

/**
 * Re-export the context hook with haptic feedback wrappers
 */
export function useAuthWithHaptics() {
  const auth = useAuthStore();
  
  const loginWithHaptics = useCallback(async (email: string, password: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await auth.login(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [auth]);
  
  const logoutWithHaptics = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await auth.logout();
  }, [auth]);
  
  const registerWithHaptics = useCallback(async (data: {
    email: string;
    username: string;
    password: string;
  }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await auth.register(data.email, data.username, data.password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    }
  }, [auth]);
  
  return {
    ...auth,
    login: loginWithHaptics,
    logout: logoutWithHaptics,
    register: registerWithHaptics,
  };
}

/**
 * Hook for Two-Factor Authentication
 */
export function useTwoFactor() {
  const [isEnabling, setIsEnabling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const enable2FA = useCallback(async () => {
    setIsEnabling(true);
    setError(null);
    try {
      const response = await api.post('/api/v1/auth/2fa/enable');
      const data = response.data.data || response.data;
      setQrCodeUri(data.totp_uri || data.qr_uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to enable 2FA';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return null;
    } finally {
      setIsEnabling(false);
    }
  }, []);

  const verify2FA = useCallback(async (code: string) => {
    setIsVerifying(true);
    setError(null);
    try {
      const response = await api.post('/api/v1/auth/2fa/verify', { code });
      const data = response.data.data || response.data;
      setBackupCodes(data.backup_codes || []);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const disable2FA = useCallback(async (code: string) => {
    setError(null);
    try {
      await api.post('/api/v1/auth/2fa/disable', { code });
      setQrCodeUri(null);
      setBackupCodes([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to disable 2FA';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, []);

  return {
    isEnabling,
    isVerifying,
    qrCodeUri,
    backupCodes,
    error,
    enable2FA,
    verify2FA,
    disable2FA,
  };
}

/**
 * Hook for session management
 */
export function useSessions() {
  const [sessions, setSessions] = useState<Array<{
    id: string;
    device: string;
    ip: string;
    lastActive: string;
    isCurrent: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/auth/sessions');
      const data = response.data.data || response.data.sessions || response.data;
      setSessions(Array.isArray(data) ? data : []);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      await api.delete(`/api/v1/auth/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke session';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, []);

  const revokeAllOtherSessions = useCallback(async () => {
    try {
      await api.delete('/api/v1/auth/sessions');
      setSessions(prev => prev.filter(s => s.isCurrent));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke sessions';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, []);

  return {
    sessions,
    isLoading,
    error,
    getSessions,
    revokeSession,
    revokeAllOtherSessions,
  };
}
