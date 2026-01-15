import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { CustomizationProvider } from './src/contexts/CustomizationContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { E2EEProvider } from './src/lib/crypto/E2EEContext';
import RootNavigator from './src/navigation/RootNavigator';
import { queryClient } from './src/lib/queryClient';
import { usePushNotifications } from './src/hooks/usePushNotifications';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Separate component for push notifications - must be inside NavigationContainer
function PushNotificationHandler({ children }: { children: React.ReactNode }) {
  // Initialize push notifications - auto-registers when authenticated
  usePushNotifications();
  return <>{children}</>;
}

function AppContent() {
  const { colorScheme } = useTheme();
  
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
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
        // Load fonts
        await Font.loadAsync({
          // Add custom fonts here if needed
        });
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
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <CustomizationProvider>
            <ThemeProvider>
              <AuthProvider>
                <SettingsProvider>
                  <E2EEProvider>
                    <AppContent />
                  </E2EEProvider>
                </SettingsProvider>
              </AuthProvider>
            </ThemeProvider>
          </CustomizationProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
