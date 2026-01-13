/**
 * Auth Hooks (Mobile)
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';

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
 * Hook for authentication actions
 */
export function useAuth() {
  const isAuthenticated = false;
  const user = null;
  const isLoading = false;
  
  const login = useCallback(async (email: string, password: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement
    return false;
  }, []);
  
  const logout = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement
  }, []);
  
  const register = useCallback(async (data: {
    email: string;
    username: string;
    password: string;
  }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement
    return false;
  }, []);
  
  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    register,
  };
}
