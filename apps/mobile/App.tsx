// Polyfill crypto.getRandomValues for Hermes (MUST be first import)
import 'react-native-get-random-values';

import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import deepLinks from './src/lib/deepLinks';
import { ErrorBoundary } from './src/components/error';
import { E2EEProvider } from './src/lib/crypto/e2-ee-context';
import RootNavigator from './src/navigation/root-navigator';
import BiometricGate from './src/shell/layout';
import { queryClient } from './src/lib/queryClient';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { initErrorTracking } from './src/lib/error-tracking';
import { initializeStores, useColorScheme, useIsAuthenticated } from './src/stores';
import { useSettingsStore } from './src/stores/settingsStore';
import { MobileWalletProvider } from './src/lib/wallet';

// Initialize error tracking on module load
initErrorTracking();

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Separate component for push notifications - must be inside NavigationContainer
function PushNotificationHandler({ children }: { children: React.ReactNode }) {
  // Initialize push notifications - auto-registers when authenticated
  usePushNotifications();
  return <>{children}</>;
}

/**
 * Sync settings from API when user authenticates.
 * Replaces the old SettingsProvider's useEffect on isAuthenticated.
 */
function SettingsSync() {
  const isAuthenticated = useIsAuthenticated();
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated, fetchSettings]);

  return null;
}

function AppContent() {
  const colorScheme = useColorScheme();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <SettingsSync />
      <NavigationContainer
        linking={{
          prefixes: deepLinks.prefixes,
          config: deepLinks.config,
        }}
        fallback={
          <View style={styles.linkingFallback}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        }
      >
        <PushNotificationHandler>
          <RootNavigator />
        </PushNotificationHandler>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize Zustand stores (hydrate from SecureStore / AsyncStorage)
        // and load fonts in parallel
        await Promise.all([
          initializeStores(),
          Font.loadAsync({
            // Add custom fonts here if needed
          }),
        ]);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary name="Root" showRetry>
            <E2EEProvider>
              <MobileWalletProvider>
                <BiometricGate>
                  <AppContent />
                </BiometricGate>
              </MobileWalletProvider>
            </E2EEProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  linkingFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1117',
  },
});
