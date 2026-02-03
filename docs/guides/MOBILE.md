# CGraph Mobile Guide

> Building native experiences with React Native and Expo.

So you want to work on the mobile app? Cool. We built this with React Native and Expo SDK 54, and
honestly it's been a pretty good experience. The New Architecture is enabled by default (Fabric
renderer, TurboModules — the whole shebang), and we share a lot of code with the web app which keeps
things DRY.

Fair warning: mobile development has its quirks. iOS simulators are slow to boot, Android emulators
eat RAM for breakfast, and you'll probably fight with CocoaPods at some point. But once you're set
up, iteration is fast and the end result feels genuinely native.

Let's dive in.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Architecture](#architecture)
5. [Navigation](#navigation)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Real-Time Features](#real-time-features)
9. [Push Notifications](#push-notifications)
10. [Styling](#styling)
11. [Device Features](#device-features)
12. [Security Features](#security-features)
13. [Storybook](#storybook)
14. [Testing](#testing)
15. [Building for Production](#building-for-production)
16. [App Store Submission](#app-store-submission)
17. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Technology                  | Version | Purpose                                |
| --------------------------- | ------- | -------------------------------------- |
| **React Native**            | 0.81    | Mobile UI framework (New Architecture) |
| **Expo**                    | 54.x    | Development toolkit                    |
| **React**                   | 19.1    | UI library                             |
| **TypeScript**              | 5.9     | Type safety                            |
| **React Navigation**        | 7.x     | Navigation library                     |
| **Zustand**                 | 5.x     | State management                       |
| **React Query**             | 5.x     | Server state                           |
| **Phoenix Channels**        | 1.8     | Real-time WebSocket                    |
| **Expo Notifications**      | 0.32    | Push notifications                     |
| **React Native Reanimated** | 4.x     | Animations (with Worklets)             |
| **Expo Local Auth**         | 17.x    | Biometric authentication               |
| **Storybook React Native**  | 8.6     | Component documentation                |

---

## Project Structure

```
apps/mobile/
├── App.tsx                 # Root component
├── app.json                # Expo configuration
├── index.js                # Entry point
├── package.json
├── tsconfig.json
├── babel.config.js
│
├── assets/                 # Static assets
│   ├── fonts/
│   ├── images/
│   └── icon.png
│
├── src/
│   ├── components/         # Reusable components
│   │   ├── common/         # Shared components
│   │   ├── chat/           # Chat-specific
│   │   └── ui/             # Base primitives
│   │
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   └── useNotifications.ts
│   │
│   ├── lib/                # Utilities
│   │   ├── api.ts          # Axios instance
│   │   ├── socket.ts       # Phoenix connection
│   │   ├── storage.ts      # Secure storage
│   │   └── crypto/         # Encryption utilities
│   │       ├── e2ee.ts     # Core E2EE functions
│   │       └── E2EEContext.tsx  # E2EE React context
│   │
│   ├── navigation/         # Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   ├── MessagesNavigator.tsx
│   │   ├── GroupsNavigator.tsx
│   │   ├── ForumsNavigator.tsx
│   │   └── SettingsNavigator.tsx
│   │
│   ├── screens/            # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── WalletAuthScreen.tsx
│   │   ├── messages/
│   │   │   ├── ConversationsScreen.tsx
│   │   │   └── ChatScreen.tsx
│   │   ├── groups/
│   │   ├── forums/
│   │   └── settings/
│   │
│   ├── stores/             # Zustand stores
│   │   ├── authStore.ts
│   │   └── chatStore.ts
│   │
│   └── types/              # TypeScript types
│       └── index.ts
│
└── eas.json                # EAS Build config
```

---

## Getting Started

### Prerequisites

- **Node.js 22+** (required for SDK 54)
- **pnpm 10+** (required for workspace compatibility)
- iOS: Xcode 16+ (for simulator)
- Android: Android Studio Ladybug+ (for emulator)
- Expo Go app on your device (for testing)

> **Note:** SDK 54 enables the New Architecture (Fabric Renderer + TurboModules) by default for
> improved performance.

### Development Setup

```bash
# From repo root
cd apps/mobile

# Install dependencies
pnpm install

# Start the development server (clears cache for clean start)
pnpm start

# Or start for specific platform
pnpm ios      # iOS simulator
pnpm android  # Android emulator
```

### Environment Configuration

CGraph mobile uses `app.config.js` for dynamic environment configuration:

```javascript
// app.config.js
const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getApiUrl = () => {
  if (process.env.API_URL) return process.env.API_URL;
  if (IS_DEV) return 'http://localhost:4000';
  if (IS_PREVIEW) return 'https://staging-api.cgraph.org';
  return 'https://api.cgraph.org';
};

export default {
  expo: {
    name: IS_DEV ? 'CGraph (Dev)' : IS_PREVIEW ? 'CGraph (Preview)' : 'CGraph',
    extra: {
      apiUrl: getApiUrl(),
      isDevMode: IS_DEV,
    },
    // ... rest of config
  },
};
```

#### Platform-Specific API URLs

The mobile app automatically handles localhost connections for development:

```typescript
// src/lib/api.ts
import { Platform } from 'react-native';

const getApiUrl = (): string => {
  const configuredUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';

  // Android emulator can't access host's localhost directly
  if (__DEV__ && Platform.OS === 'android' && configuredUrl.includes('localhost')) {
    return configuredUrl.replace('localhost', '10.0.2.2');
  }

  return configuredUrl;
};
```

| Environment | Android Emulator | iOS Simulator  | Physical Device |
| ----------- | ---------------- | -------------- | --------------- |
| Development | 10.0.2.2:4000    | localhost:4000 | LAN IP:4000     |
| Production  | api.cgraph.org   | api.cgraph.org | api.cgraph.org  |

### Expo Configuration

The app uses `app.config.js` (dynamic) extending `app.json` (static):

```json
// app.json (static base config)
{
  "expo": {
    "name": "CGraph",
    "slug": "cgraph",
    "version": "1.0.0",
    "newArchEnabled": true,
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#111827"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "app.cgraph.mobile",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#111827"
      },
      "package": "app.cgraph.mobile",
      "versionCode": 1
    },
    "plugins": [
      "expo-secure-store",
      "expo-local-authentication",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#3b82f6"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow CGraph to access your photos"
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow CGraph to use your camera"
        }
      ]
    ],
    "extra": {
      "apiUrl": "http://localhost:4000",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

---

## Architecture

### High-Level Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     React Native App                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Navigation Layer                        │   │
│  │  RootNavigator → Auth/Main → Tab/Stack Navigators       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Screen Layer                           │   │
│  │  Screens use hooks for state, call actions              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                Component Layer                           │   │
│  │  Reusable UI components, forms, lists                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   State Layer                            │   │
│  │    AuthContext    │    Zustand    │   React Query       │   │
│  │   (user session)  │  (UI state)   │  (server cache)     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Service Layer                            │   │
│  │    API (Axios)    │   Socket (Phoenix)  │  Storage      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Navigation

We use React Navigation with a combination of stack and tab navigators.

### Navigation Structure

```
RootNavigator
├── AuthNavigator (Stack)
│   ├── Login
│   ├── Register
│   ├── ForgotPassword
│   └── WalletAuth
│
└── MainNavigator (Tab)
    ├── MessagesNavigator (Stack)
    │   ├── Conversations
    │   └── Chat
    │
    ├── GroupsNavigator (Stack)
    │   ├── Groups
    │   ├── Group
    │   └── Channel
    │
    ├── ForumsNavigator (Stack)
    │   ├── Forums
    │   ├── Forum
    │   └── Post
    │
    └── SettingsNavigator (Stack)
        ├── Settings
        ├── Account
        ├── Notifications
        └── Privacy
```

### Root Navigator

```tsx
// src/navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '@/screens/LoadingScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

### Tab Navigator

```tsx
// src/navigation/MainNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Messages: focused ? 'chatbubbles' : 'chatbubbles-outline',
            Groups: focused ? 'people' : 'people-outline',
            Forums: focused ? 'newspaper' : 'newspaper-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Messages" component={MessagesNavigator} />
      <Tab.Screen name="Groups" component={GroupsNavigator} />
      <Tab.Screen name="Forums" component={ForumsNavigator} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}
```

### Type-Safe Navigation

```tsx
// src/types/navigation.ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  WalletAuth: undefined;
};

export type MainTabParamList = {
  Messages: undefined;
  Groups: undefined;
  Forums: undefined;
  Settings: undefined;
};

export type MessagesStackParamList = {
  Conversations: undefined;
  Chat: { conversationId: string; title: string };
};

// Combined types for screens
export type ChatScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MessagesStackParamList, 'Chat'>,
  BottomTabScreenProps<MainTabParamList>
>;
```

### Using Navigation

```tsx
// In a screen component
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessagesStackParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<MessagesStackParamList>;

function ConversationsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const openChat = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      title: conversation.participant.username,
    });
  };

  // ...
}
```

---

## State Management

### Auth Context

```tsx
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const { data } = await api.get('/me');
        setUser(data.data);
      }
    } catch (error) {
      await SecureStore.deleteItemAsync('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('token', data.data.token);
    await SecureStore.setItemAsync('refreshToken', data.data.refresh_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
    setUser(data.data.user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const register = async (email: string, username: string, password: string) => {
    const { data } = await api.post('/auth/register', { email, username, password });
    await SecureStore.setItemAsync('token', data.data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
    setUser(data.data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Theme Context

```tsx
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

const darkTheme = {
  background: '#111827',
  surface: '#1f2937',
  border: '#374151',
  primary: '#3b82f6',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  error: '#ef4444',
  success: '#22c55e',
};

const lightTheme = {
  background: '#ffffff',
  surface: '#f3f4f6',
  border: '#e5e7eb',
  primary: '#3b82f6',
  text: '#111827',
  textSecondary: '#6b7280',
  error: '#ef4444',
  success: '#22c55e',
};

interface ThemeContextType {
  colorScheme: 'light' | 'dark';
  colors: typeof darkTheme;
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'dark',
  colors: darkTheme,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = colorScheme === 'dark' ? darkTheme : lightTheme;

  return <ThemeContext.Provider value={{ colorScheme, colors }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

### E2EE Context

The E2EE (End-to-End Encryption) context handles all cryptographic operations for secure messaging.
It's provided at the app root level and offers graceful degradation when encryption isn't yet
initialized.

```tsx
// App.tsx - Provider hierarchy
import { E2EEProvider } from './src/lib/crypto/E2EEContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <E2EEProvider>
                <AppContent />
              </E2EEProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

The hook returns safe defaults when called outside a provider (useful for testing or screens that
don't need encryption):

```tsx
// Using E2EE in a component
import { useE2EE } from '@/lib/crypto/E2EEContext';

function ChatScreen() {
  const {
    isInitialized, // Whether E2EE keys are set up
    isLoading, // Loading state during setup
    encryptMessage, // Encrypt plaintext for a recipient
    decryptMessage, // Decrypt received message
    getSafetyNumber, // Get verification code for a contact
  } = useE2EE();

  const sendSecureMessage = async (recipientId: string, text: string) => {
    if (!isInitialized) {
      // Fall back to server-side encryption or show setup prompt
      return sendUnencrypted(text);
    }

    const encrypted = await encryptMessage(recipientId, text);
    await api.post('/messages', {
      recipient_id: recipientId,
      encrypted_content: encrypted,
    });
  };

  // ...
}
```

For components that absolutely require E2EE (like key verification screens), use the strict variant:

```tsx
import { useE2EEStrict } from '@/lib/crypto/E2EEContext';

function KeyVerificationScreen() {
  // Throws if not within E2EEProvider - catches misconfiguration early
  const { getSafetyNumber, getFingerprint } = useE2EEStrict();

  // ...
}
```

---

## API Integration

### Axios Configuration

```typescript
// src/lib/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { config } from './config';

export const api = axios.create({
  baseURL: `${config.apiUrl}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(`${config.apiUrl}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        await SecureStore.setItemAsync('token', data.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
        originalRequest.headers['Authorization'] = `Bearer ${data.data.token}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Force logout
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('refreshToken');
        // Navigate to login will happen via AuthContext
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### React Query Hooks

```typescript
// src/hooks/useConversations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/conversations');
      return data.data;
    },
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}/messages`);
      return data.data;
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      const { data } = await api.post(`/conversations/${conversationId}/messages`, {
        content,
      });
      return data.data;
    },
    onSuccess: (newMessage, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
```

---

## Real-Time Features

### Socket Connection

```typescript
// src/lib/socket.ts
import { Socket, Channel } from 'phoenix';
import * as SecureStore from 'expo-secure-store';
import { config } from './config';

class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();

  async connect() {
    const token = await SecureStore.getItemAsync('token');
    if (!token) return;

    this.socket = new Socket(config.wsUrl, {
      params: { token },
    });

    this.socket.connect();
  }

  disconnect() {
    this.channels.forEach((channel) => channel.leave());
    this.channels.clear();
    this.socket?.disconnect();
    this.socket = null;
  }

  joinChannel(topic: string): Channel | null {
    if (!this.socket) return null;

    if (this.channels.has(topic)) {
      return this.channels.get(topic)!;
    }

    const channel = this.socket.channel(topic, {});
    channel.join();
    this.channels.set(topic, channel);
    return channel;
  }

  leaveChannel(topic: string) {
    const channel = this.channels.get(topic);
    if (channel) {
      channel.leave();
      this.channels.delete(topic);
    }
  }
}

export const socketManager = new SocketManager();
```

### useSocket Hook

```typescript
// src/hooks/useSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { Channel } from 'phoenix';
import { socketManager } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { AppState, AppStateStatus } from 'react-native';

export function useChannel(topic: string) {
  const channelRef = useRef<Channel | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const connect = async () => {
      await socketManager.connect();
      channelRef.current = socketManager.joinChannel(topic);
    };

    connect();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        connect();
      } else if (state === 'background') {
        socketManager.leaveChannel(topic);
      }
    });

    return () => {
      socketManager.leaveChannel(topic);
      subscription.remove();
    };
  }, [topic, isAuthenticated]);

  const push = useCallback((event: string, payload = {}) => {
    return channelRef.current?.push(event, payload);
  }, []);

  const on = useCallback((event: string, callback: (payload: any) => void) => {
    channelRef.current?.on(event, callback);
    return () => channelRef.current?.off(event, callback);
  }, []);

  return { push, on };
}
```

---

## Deep Links (v0.9.3)

CGraph supports Universal Links (iOS) and App Links (Android) for seamless deep linking.

### Configuration

**iOS** (`app.config.js`):

```javascript
ios: {
  associatedDomains: [
    'applinks:cgraph.org',
    'applinks:www.cgraph.org',
  ],
}
```

**Android** (`app.config.js`):

```javascript
android: {
  intentFilters: [{
    action: 'VIEW',
    autoVerify: true,
    data: [
      { scheme: 'https', host: 'cgraph.org', pathPrefix: '/' },
      { scheme: 'https', host: 'www.cgraph.org', pathPrefix: '/' },
      { scheme: 'cgraph' },
    ],
    category: ['BROWSABLE', 'DEFAULT'],
  }],
}
```

### Deep Link Handler

```typescript
// src/lib/deepLinks.ts
import { handleDeepLink, createShareableLink } from '@/lib/deepLinks';

// Handle incoming deep links in App.tsx
useEffect(() => {
  // Handle links when app is already open
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url, navigation);
  });

  // Handle links that opened the app
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink(url, navigation);
  });

  return () => subscription.remove();
}, [navigation]);

// Create shareable links
const shareConversation = () => {
  const link = createShareableLink('conversation', conversationId);
  // Returns: https://cgraph.org/messages/abc123
  Share.share({ url: link });
};
```

### Supported Routes

| URL Pattern                          | Screen       | Parameters             |
| ------------------------------------ | ------------ | ---------------------- |
| `/messages/:id`                      | Conversation | `conversationId`       |
| `/groups/:id`                        | GroupDetail  | `groupId`              |
| `/groups/:id/channels/:channelId`    | Channel      | `groupId`, `channelId` |
| `/forums/:id`                        | Forum        | `forumId`              |
| `/forums/:forumId/threads/:threadId` | Thread       | `forumId`, `threadId`  |
| `/profile/:id`                       | UserProfile  | `userId`               |
| `/settings`                          | Settings     | -                      |
| `/invite/:code`                      | InviteAccept | `inviteCode`           |

### Server-Side Configuration

**iOS** (`public/.well-known/apple-app-site-association`):

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["TEAM_ID.org.cgraph.app"],
        "paths": ["/messages/*", "/groups/*", "/forums/*", "/profile/*", "/settings", "/invite/*"]
      }
    ]
  }
}
```

**Android** (`public/.well-known/assetlinks.json`):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "org.cgraph.app",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

---

## Push Notifications

### Setup

```typescript
// src/hooks/useNotifications.ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications();

    // Handle received notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Handle notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationTap(data);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated]);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token');
      return;
    }

    // Get Expo push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id',
    });

    // Send token to backend
    await api.post('/push-tokens', { token: token.data });

    // Android-specific channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });

      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'message.wav',
      });
    }
  };

  const handleNotificationTap = (data: any) => {
    // Navigate based on notification type
    switch (data.type) {
      case 'message':
        // Navigate to conversation
        break;
      case 'friend_request':
        // Navigate to friends
        break;
      default:
        break;
    }
  };

  return { registerForPushNotifications };
}
```

### Backend Push Integration

```elixir
# In your Phoenix backend
defmodule CGraph.PushNotifications do
  @expo_url "https://exp.host/--/api/v2/push/send"

  def send_push(user_id, title, body, data \\ %{}) do
    tokens = get_user_push_tokens(user_id)

    messages = Enum.map(tokens, fn token ->
      %{
        to: token,
        title: title,
        body: body,
        data: data,
        sound: "default"
      }
    end)

    HTTPoison.post(@expo_url, Jason.encode!(messages), [
      {"Content-Type", "application/json"}
    ])
  end
end
```

---

## Styling

### Styled Components Pattern

```tsx
// src/components/ui/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const buttonStyles: ViewStyle = {
    ...styles.base,
    ...styles[size],
    ...(variant === 'primary' && { backgroundColor: colors.primary }),
    ...(variant === 'secondary' && { backgroundColor: colors.surface }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    }),
    ...(disabled && { opacity: 0.5 }),
  };

  const textStyles: TextStyle = {
    ...styles.text,
    ...(variant === 'primary' && { color: '#ffffff' }),
    ...(variant === 'secondary' && { color: colors.text }),
    ...(variant === 'outline' && { color: colors.text }),
  };

  return (
    <TouchableOpacity
      style={[buttonStyles, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textStyles.color} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Responsive Design

```tsx
import { Dimensions, useWindowDimensions } from 'react-native';

// Hook for responsive values
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmall = width < 375;
  const isMedium = width >= 375 && width < 768;
  const isLarge = width >= 768;

  const spacing = {
    xs: isSmall ? 4 : 8,
    sm: isSmall ? 8 : 12,
    md: isSmall ? 12 : 16,
    lg: isSmall ? 16 : 24,
    xl: isSmall ? 24 : 32,
  };

  const fontSize = {
    xs: isSmall ? 10 : 12,
    sm: isSmall ? 12 : 14,
    md: isSmall ? 14 : 16,
    lg: isSmall ? 18 : 20,
    xl: isSmall ? 24 : 28,
  };

  return { width, height, isSmall, isMedium, isLarge, spacing, fontSize };
}
```

### Animation Library

The mobile app includes a comprehensive animation library at `src/lib/animations/` using React
Native Reanimated v4 and Gesture Handler v2.

> **⚠️ Breaking Change (v0.9.11):** We migrated from Reanimated v3 to v4. See
> [ADR-018: Reanimated v4 Migration](../adr/ADR-018-REANIMATED-V4-MIGRATION.md) for full details.

#### Gesture API (v4)

The new Gesture API replaces the deprecated `useAnimatedGestureHandler`:

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  SharedValue, // Direct import, NOT Animated.SharedValue
} from 'react-native-reanimated';
import { getSpringConfig, SPRING_PRESETS } from '@/lib/animations/AnimationLibrary';

function SwipeCard() {
  const translateX = useSharedValue(0);
  const ctx = useSharedValue({ startX: 0 });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      ctx.value = { startX: translateX.value };
    })
    .onUpdate((e) => {
      'worklet';
      translateX.value = ctx.value.startX + e.translationX;
    })
    .onEnd(() => {
      'worklet';
      translateX.value = withSpring(0, getSpringConfig(SPRING_PRESETS.bouncy));
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>{/* Content */}</Animated.View>
    </GestureDetector>
  );
}
```

**Key migration points:**

- Replace `useAnimatedGestureHandler` with `Gesture.Pan()`, `Gesture.Tap()`, etc.
- Replace `PanGestureHandler` with `GestureDetector`
- Store context in `useSharedValue`, not in the gesture handler's `ctx` parameter
- Add `'worklet'` directive to all gesture callbacks
- Use `getSpringConfig()` helper when calling `withSpring()` with our extended SpringConfig

#### Spring Configuration

```tsx
import { SPRING_PRESETS, getSpringConfig } from '@/lib/animations/AnimationLibrary';

// Available presets
SPRING_PRESETS.gentle; // damping: 15, stiffness: 100
SPRING_PRESETS.bouncy; // damping: 10, stiffness: 180
SPRING_PRESETS.stiff; // damping: 20, stiffness: 300
SPRING_PRESETS.slow; // damping: 20, stiffness: 80

// Use with withSpring (must extract WithSpringConfig-compatible props)
translateX.value = withSpring(0, getSpringConfig(SPRING_PRESETS.bouncy));
```

#### Basic Animations (Legacy API)

```typescript
// src/lib/animations.ts
import { createFadeIn, createSlideUp, createScale, pulseAnimation } from '@/lib/animations';

// Duration and easing presets
durations.fast     // 200
durations.normal   // 300
durations.slow     // 500

// Create animation values with built-in animations
const opacity = createFadeIn(300);    // Animated.Value with fadeIn
const translateY = createSlideUp();   // Animated.Value with slide
const scale = createScale(1);         // Animated.Value for scaling

// Run animations
fadeInAnimation(opacity);             // Fade from 0 to 1
slideUpAnimation(translateY, -20);    // Slide up 20px
scaleAnimation(scale, 1.1, 1);        // Scale up then back

// Pulse animation (looping)
pulseAnimation(scale);                // 1 -> 1.05 -> 1 loop

// Staggered list animations
{items.map((item, i) => (
  <AnimatedCard delay={i * 50}>{item}</AnimatedCard>
))}
```

### AnimatedCard Component

```tsx
// src/components/AnimatedCard.tsx
import { AnimatedCard } from '@/components';

// Animated container with press feedback
<AnimatedCard onPress={handlePress} delay={100}>
  <Text>Content with fade-in and press scale</Text>
</AnimatedCard>;
```

### Conversation Screen Features

The conversation screen delivers a polished messaging experience with thoughtful interactions:

**Header Actions:**

- Tap the contact name to view their profile
- Voice and video call buttons for WebRTC 1:1 and group calls
- Visual encryption indicator showing E2EE protection status

**Attachment Menu (TelegramAttachmentPicker):**  
Tap the + button to reveal a beautiful slide-up menu with options to:

- Share photos and videos from your library (with proper Android URI resolution)
- Capture photos or videos with camera (photo/video mode toggle)
- Send documents and files
- Share contacts (Telegram-style contact picker with animations)
- Share your location (planned)

> **v0.7.39 Note:** Gallery loading now includes fallback UI for Expo Go environments where
> MediaLibrary has limited access. When the gallery grid is empty, users see "Browse Gallery" and
> "Take Photo/Video" buttons that use ImagePicker directly. Camera now supports both photo and video
> recording with a mode toggle.

**Contact Sharing (v0.7.39):** The contact picker provides a Telegram-style experience:

- Full-screen animated contact list with smooth entrance
- Search bar to filter by name or phone number
- Contact cards show photo (or initials avatar), name, and number
- Haptic feedback on selection
- Contacts shared as VCF format with name, phone, and email data
- Requires `expo-contacts` permission

**Video Recording (v0.7.39):** Camera mode now supports both photos and videos:

- Photo/Video toggle buttons at bottom of camera view
- Video mode uses `recordAsync()` for recording
- Red dot + "REC" indicator while recording
- Tap capture button to start/stop recording

**Video Messages:** Videos sent in conversations display inline with:

- Real video frame thumbnail (no placeholder icons)
- Play button overlay for tapping to view fullscreen
- Duration badge showing video length
- Fullscreen video player with custom controls (play/pause, progress bar, time display)
- Clean message bubbles without redundant "📷 Photo" or "🎥 Video" labels

**Pinned Messages Bar (v0.7.39):** The enhanced pinned messages header provides rich context:

- Gradient indicator bar showing pin count visually
- Media thumbnails for pinned images/videos (actual preview, not icons)
- Voice message indicator (microphone icon) for pinned voice notes
- File attachment indicator (document icon) for pinned files
- Sender name displayed above message preview
- Progress dots for navigating multiple pins (clickable for direct access)
- Smooth navigation arrows for prev/next pin
- Tap anywhere on bar to scroll to pinned message
- Maximum 3 pinned messages per conversation

**Message Status:**  
Every outgoing message shows delivery status with intuitive icons:

- Single checkmark = sent to server
- Double checkmark = delivered to recipient
- Blue double checkmark = message was read
- Clock icon = sending in progress

**Empty Conversation Experience:**  
New conversations greet you with:

- Large profile avatar of your contact
- "Wave to [name]" button that sends a random friendly emoji
- "Say Hi" button pre-fills a greeting
- Quick starter chips for conversation openers
- Animated waving hand for that personal touch

**Voice Messages:**  
Hold the microphone to record, slide to cancel, or release to send. Visual waveform displays during
recording with real-time duration counter.

---

## Device Features

### Camera and Image Picker

```tsx
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

async function pickImage() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow access to photos');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return result.assets[0].uri;
  }

  return null;
}

async function takePhoto() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow camera access');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }

  return null;
}
```

### Audio Recording and Playback

CGraph uses `expo-audio` for voice message recording and playback. The library provides modern React
hooks for managing audio lifecycle.

```tsx
// Voice Message Playback
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

function VoicePlayer({ audioUrl }: { audioUrl: string }) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    // Configure audio for playback
    setAudioModeAsync({
      playsInSilentMode: true,
    });
  }, []);

  const handlePlayPause = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <TouchableOpacity onPress={handlePlayPause}>
      <Text>{status.playing ? 'Pause' : 'Play'}</Text>
      <Text>
        {Math.floor(status.currentTime)}s / {Math.floor(status.duration)}s
      </Text>
    </TouchableOpacity>
  );
}
```

```tsx
// Voice Message Recording
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';

function VoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const startRecording = async () => {
    // Request permissions
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) return;

    // Configure audio for recording
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
    await recorder.stop();
    const uri = recorder.uri; // Path to recorded file
    // Upload or play the recording
  };

  return (
    <View>
      <Text>Recording: {recorderState.isRecording ? 'Yes' : 'No'}</Text>
      <Text>Duration: {recorderState.durationMillis}ms</Text>
      <Button
        title={recorderState.isRecording ? 'Stop' : 'Record'}
        onPress={recorderState.isRecording ? stopRecording : startRecording}
      />
    </View>
  );
}
```

> **Note**: expo-audio replaced the deprecated expo-av library as of SDK 54. The old Audio.Sound and
> Audio.Recording APIs are no longer available.

### Secure Storage

```typescript
import * as SecureStore from 'expo-secure-store';

export const storage = {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
```

---

## Security Features

### Biometric Authentication

CGraph supports Face ID, Touch ID, and Android biometrics for app locking and secure actions:

```typescript
// src/lib/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export const biometrics = {
  /**
   * Check if biometric hardware is available
   */
  async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  },

  /**
   * Get available authentication types
   */
  async getAuthTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return LocalAuthentication.supportedAuthenticationTypesAsync();
  },

  /**
   * Authenticate user with biometrics
   */
  async authenticate(prompt?: string): Promise<BiometricResult> {
    const available = await this.isAvailable();
    if (!available) {
      return { success: false, error: 'Biometrics not available' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt || 'Authenticate to continue',
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return {
      success: result.success,
      error: result.error,
    };
  },

  /**
   * Check if biometric lock is enabled in settings
   */
  async isEnabled(): Promise<boolean> {
    const value = await SecureStore.getItemAsync('biometric_lock_enabled');
    return value === 'true';
  },

  /**
   * Enable/disable biometric lock
   */
  async setEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync('biometric_lock_enabled', enabled.toString());
  },
};
```

### Using Biometrics

```tsx
// Example: Biometric settings toggle
import { biometrics } from '@/lib/biometrics';

function SecuritySettings() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const available = await biometrics.isAvailable();
    const enabled = await biometrics.isEnabled();
    setBiometricAvailable(available);
    setBiometricEnabled(enabled);
  };

  const toggleBiometricLock = async (value: boolean) => {
    if (value) {
      // Verify identity before enabling
      const { success } = await biometrics.authenticate('Verify to enable biometric lock');
      if (success) {
        await biometrics.setEnabled(true);
        setBiometricEnabled(true);
      }
    } else {
      await biometrics.setEnabled(false);
      setBiometricEnabled(false);
    }
  };

  return (
    <View>
      {biometricAvailable && (
        <Switch
          value={biometricEnabled}
          onValueChange={toggleBiometricLock}
          label="Biometric Lock"
        />
      )}
    </View>
  );
}
```

### Account Settings Integration

The biometric lock feature is fully integrated into the Account Settings screen with real-time
status detection:

```tsx
// screens/settings/AccountScreen.tsx
import {
  getBiometricStatus,
  getBiometricName,
  setBiometricLockEnabled,
} from '../../lib/biometrics';

export default function AccountScreen() {
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      const status = await getBiometricStatus();
      setBiometricStatus(status);
      if (status.isAvailable && status.isEnrolled) {
        const enabled = await isBiometricLockEnabled();
        setBiometricEnabled(enabled);
      }
    };
    loadStatus();
  }, []);

  const handleToggle = async (value: boolean) => {
    const success = await setBiometricLockEnabled(value);
    if (success) {
      setBiometricEnabled(value);
    }
  };

  return (
    <View>
      {biometricStatus?.isAvailable && (
        <View style={styles.settingsRow}>
          <Ionicons
            name={
              biometricStatus.biometricType === 'facial' ? 'scan-outline' : 'finger-print-outline'
            }
          />
          <Text>{getBiometricName(biometricStatus.biometricType)}</Text>
          <Switch
            value={biometricEnabled}
            onValueChange={handleToggle}
            disabled={!biometricStatus.isEnrolled}
          />
        </View>
      )}
    </View>
  );
}
```

---

## Storybook

Storybook for React Native lets you develop and test mobile components in isolation, right on your
device or simulator. It provides an on-device UI for browsing component stories.

### Getting Started

```bash
# Generate story list and start Expo with Storybook
pnpm storybook

# Just regenerate story list
pnpm storybook:generate
```

### Configuration

Storybook is configured in the `.storybook/` directory:

```
apps/mobile/.storybook/
├── main.ts        # Story discovery configuration
├── preview.tsx    # Global decorators and parameters
└── index.tsx      # Storybook entry point
```

### Writing Stories

Stories live in `src/components/stories/` with a `.stories.tsx` extension:

```
src/components/stories/
├── Button.stories.tsx
├── Input.stories.tsx
├── Avatar.stories.tsx
└── ...
```

#### Basic Story Pattern

```tsx
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Button from '../Button';
import { ThemeProvider } from '../../contexts/ThemeContext';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};
```

### On-Device Addons

We include two on-device addons:

- **Controls** — Edit component props in real-time
- **Actions** — Log callback function calls

### Using Storybook in Development

To view Storybook, you can temporarily switch your app's entry point:

```tsx
// App.tsx (for Storybook development)
import StorybookUIRoot from './.storybook';
export default StorybookUIRoot;
```

Or use environment variables to toggle between Storybook and the regular app.

---

## Testing

CGraph mobile has a comprehensive testing infrastructure built with Jest, Testing Library, and
custom utilities designed for React Native and Expo applications.

### Testing Stack

| Tool                              | Version | Purpose                   |
| --------------------------------- | ------- | ------------------------- |
| **Jest**                          | 29.7    | Test runner               |
| **jest-expo**                     | 54.0    | Expo-specific Jest preset |
| **@testing-library/react-native** | 13.2    | Component testing         |
| **react-test-renderer**           | 19.1    | React test utilities      |

### Test Structure

```
apps/mobile/
├── jest.config.js              # Jest configuration
├── src/
│   ├── test/
│   │   ├── setup.ts            # Global test setup and mocks
│   │   └── utils.tsx           # Test utilities and helpers
│   │
│   ├── components/
│   │   └── __tests__/          # Component tests
│   │       ├── Button.test.tsx
│   │       ├── Input.test.tsx
│   │       └── Avatar.test.tsx
│   │
│   ├── screens/
│   │   └── auth/
│   │       └── __tests__/      # Screen tests
│   │           ├── LoginScreen.test.tsx
│   │           └── RegisterScreen.test.tsx
│   │
│   ├── contexts/
│   │   └── __tests__/          # Context tests
│   │       ├── AuthContext.test.tsx
│   │       └── ThemeContext.test.tsx
│   │
│   ├── hooks/
│   │   └── __tests__/          # Hook tests
│   │       └── useFriendPresence.test.ts
│   │
│   └── lib/
│       ├── __tests__/          # Utility tests
│       │   └── api.test.ts
│       └── crypto/
│           └── __tests__/      # E2EE tests
│               └── E2EEContext.test.tsx
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests in CI mode (no watch, fail fast)
pnpm test:ci

# Run specific test file
pnpm test Button.test.tsx

# Run tests matching pattern
pnpm test --testNamePattern="renders"
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|phoenix)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/test/**/*', '!src/types/**/*'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testTimeout: 10000,
  verbose: true,
};
```

### Test Setup

The test setup file configures the environment and provides global mocks:

```typescript
// src/test/setup.ts
import '@testing-library/react-native/extend-expect';

// Mock Expo modules
jest.mock('expo-secure-store');
jest.mock('expo-constants');
jest.mock('expo-haptics');
jest.mock('expo-notifications');
jest.mock('expo-local-authentication');
jest.mock('expo-clipboard');
jest.mock('expo-image-picker');
jest.mock('expo-file-system');

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

// Mock Phoenix socket
jest.mock('phoenix', () => ({
  Socket: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    channel: jest.fn(),
  })),
}));

// Silence console warnings in tests
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
```

### Test Utilities

The utilities file provides helpers for common testing patterns:

```typescript
// src/test/utils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Wrapper with all providers
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>{children}</NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Custom render with providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Mock factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: null,
  ...overrides,
});

export const createMockMessage = (overrides = {}) => ({
  id: 'msg-123',
  content: 'Hello world',
  sender_id: 'user-123',
  inserted_at: new Date().toISOString(),
  ...overrides,
});

export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
});

// Async helpers
export const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
export const flushPromises = () => new Promise(setImmediate);

// Re-export testing library
export * from '@testing-library/react-native';
```

### Component Testing

Test UI components in isolation:

```typescript
// src/components/__tests__/Button.test.tsx
import React from 'react';
import { renderWithProviders, fireEvent } from '../../test/utils';
import Button from '../Button';

describe('Button', () => {
  it('renders with correct text', () => {
    const { getByText } = renderWithProviders(
      <Button onPress={jest.fn()}>Click me</Button>
    );
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <Button onPress={onPress}>Click me</Button>
    );
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithProviders(
      <Button onPress={onPress} disabled>Click me</Button>
    );
    fireEvent.press(getByText('Click me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId, queryByText } = renderWithProviders(
      <Button onPress={jest.fn()} loading>Click me</Button>
    );
    expect(queryByText('Click me')).toBeNull();
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  describe('variants', () => {
    it.each(['primary', 'secondary', 'outline', 'ghost', 'danger'] as const)(
      'renders %s variant',
      (variant) => {
        const { getByTestId } = renderWithProviders(
          <Button onPress={jest.fn()} variant={variant} testID="button">
            Test
          </Button>
        );
        expect(getByTestId('button')).toBeTruthy();
      }
    );
  });
});
```

### Screen Testing

Test complete screens with navigation and form handling:

```typescript
// src/screens/auth/__tests__/LoginScreen.test.tsx
import React from 'react';
import { Alert } from 'react-native';
import { renderWithProviders, fireEvent, waitFor } from '../../../test/utils';
import LoginScreen from '../LoginScreen';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

const mockLogin = jest.fn();

describe('LoginScreen', () => {
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation as any} />
    );

    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('shows validation error for empty form', async () => {
    jest.spyOn(Alert, 'alert');
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation as any} />
    );

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please enter your email and password'
      );
    });
  });

  it('calls login with credentials', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation as any} />
    );

    fireEvent.changeText(
      getByPlaceholderText('Enter your email'),
      'test@example.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter your password'),
      'password123'
    );
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('handles login failure', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } },
    });
    jest.spyOn(Alert, 'alert');

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation as any} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'wrong');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed',
        'Invalid credentials'
      );
    });
  });
});
```

### Context Testing

Test React Context providers and consumers:

```typescript
// src/contexts/__tests__/AuthContext.test.tsx
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../AuthContext';
import api from '../../lib/api';

jest.mock('expo-secure-store');
jest.mock('../../lib/api');

const TestConsumer = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <>
      <Text testID="authenticated">{isAuthenticated ? 'yes' : 'no'}</Text>
      <Text testID="user">{user?.email || 'none'}</Text>
      <Pressable testID="login" onPress={() => login('test@example.com', 'pass')} />
      <Pressable testID="logout" onPress={logout} />
    </>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it('starts unauthenticated', async () => {
    const { getByTestId } = render(
      <AuthProvider><TestConsumer /></AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('authenticated').props.children).toBe('no');
    });
  });

  it('authenticates on login', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { token: 'jwt', user: { email: 'test@example.com' } },
    });

    const { getByTestId } = render(
      <AuthProvider><TestConsumer /></AuthProvider>
    );

    await act(async () => {
      getByTestId('login').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('authenticated').props.children).toBe('yes');
      expect(getByTestId('user').props.children).toBe('test@example.com');
    });
  });
});
```

### Hook Testing

Test custom hooks with `renderHook`:

```typescript
// src/hooks/__tests__/useFriendPresence.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFriendPresence } from '../useFriendPresence';
import socketManager from '../../lib/socket';

jest.mock('../../lib/socket');

describe('useFriendPresence', () => {
  let statusCallback: Function | null = null;

  beforeEach(() => {
    (socketManager.onGlobalStatusChange as jest.Mock).mockImplementation((cb) => {
      statusCallback = cb;
      return () => {
        statusCallback = null;
      };
    });
  });

  it('returns null for undefined userId', () => {
    const { result } = renderHook(() => useFriendPresence(undefined));
    expect(result.current).toBeNull();
  });

  it('returns initial presence', () => {
    (socketManager.getFriendPresence as jest.Mock).mockReturnValue({
      online: true,
      status: 'online',
    });

    const { result } = renderHook(() => useFriendPresence('user-123'));
    expect(result.current?.online).toBe(true);
  });

  it('updates on status change', async () => {
    (socketManager.getFriendPresence as jest.Mock).mockReturnValue({
      online: false,
      status: 'offline',
    });

    const { result } = renderHook(() => useFriendPresence('user-123'));

    act(() => {
      statusCallback?.('user-123', true, 'online');
    });

    await waitFor(() => {
      expect(result.current?.online).toBe(true);
    });
  });
});
```

### E2EE Testing

Test encryption functionality:

```typescript
// src/lib/crypto/__tests__/E2EEContext.test.tsx
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { E2EEProvider, useE2EE } from '../E2EEContext';
import * as e2ee from '../e2ee';

jest.mock('../e2ee');
jest.mock('../../api');

const TestConsumer = () => {
  const { isInitialized, setupE2EE, encryptMessage } = useE2EE();
  return (
    <>
      <Text testID="initialized">{isInitialized ? 'yes' : 'no'}</Text>
      <Pressable testID="setup" onPress={setupE2EE} />
    </>
  );
};

describe('E2EEContext', () => {
  it('checks E2EE status on mount', async () => {
    (e2ee.isE2EESetUp as jest.Mock).mockResolvedValue(false);

    render(<E2EEProvider><TestConsumer /></E2EEProvider>);

    await waitFor(() => {
      expect(e2ee.isE2EESetUp).toHaveBeenCalled();
    });
  });

  it('sets up E2EE on request', async () => {
    (e2ee.isE2EESetUp as jest.Mock).mockResolvedValue(false);
    (e2ee.generateKeyBundle as jest.Mock).mockResolvedValue({});
    (e2ee.storeKeyBundle as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(
      <E2EEProvider><TestConsumer /></E2EEProvider>
    );

    await act(async () => {
      getByTestId('setup').props.onPress();
    });

    await waitFor(() => {
      expect(e2ee.generateKeyBundle).toHaveBeenCalled();
      expect(getByTestId('initialized').props.children).toBe('yes');
    });
  });
});
```

### Testing Best Practices

1. **Use descriptive test names** - Tests should read like documentation
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Test behavior, not implementation** - Focus on what the component does
4. **Use data-testid sparingly** - Prefer accessible queries
5. **Mock at the boundary** - Mock APIs and external services, not internal modules
6. **Keep tests fast** - Use shallow rendering when appropriate
7. **Test error states** - Happy path and error paths
8. **Isolate tests** - Each test should be independent

### Coverage Goals

| Category   | Target | Current  |
| ---------- | ------ | -------- |
| Components | 80%+   | Building |
| Screens    | 70%+   | Building |
| Contexts   | 90%+   | Building |
| Hooks      | 85%+   | Building |
| Utils      | 90%+   | Building |

Run coverage report: `pnpm test:coverage`

---

## Building for Production

### EAS Build Setup

```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "RELEASE_CHANNEL": "staging"
      }
    },
    "production": {
      "env": {
        "RELEASE_CHANNEL": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Build for both
eas build --platform all --profile production
```

---

## App Store Submission

### Pre-Submission Checklist

Before submitting to app stores, ensure the following:

**GDPR/Privacy Compliance (Required):**

- ✅ Terms of Service acceptance on registration
- ✅ Privacy Policy link accessible in app
- ✅ Terms of Service link accessible in app
- ✅ Data export functionality (GDPR "right to access")
- ✅ Account deletion with confirmation (GDPR "right to be forgotten")
- ✅ iOS Privacy Manifest configured in `app.json`
- ✅ `ITSAppUsesNonExemptEncryption: false` declared (or proper export compliance)

**App Configuration (`app.json`):**

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "org.cgraph.app",
      "config": {
        "usesNonExemptEncryption": false
      },
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "NSCameraUsageDescription": "...",
        "NSPhotoLibraryUsageDescription": "...",
        "NSMicrophoneUsageDescription": "..."
      },
      "privacyManifests": {
        "NSPrivacyAccessedAPITypes": [...]
      }
    },
    "android": {
      "package": "org.cgraph.app",
      "permissions": [...]
    }
  }
}
```

**EAS Configuration (`eas.json`):**

- Development, preview, and production build profiles
- Submission configuration for iOS and Android
- Auto-increment enabled for production

### iOS (App Store Connect)

```bash
# Build for production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --latest

# Or specify a build
eas submit --platform ios --id <build-id>
```

**Required Assets:**

- App icon (1024x1024, no alpha channel)
- Screenshots for all required device sizes:
  - 6.7" (iPhone 15 Pro Max)
  - 6.5" (iPhone 14 Plus)
  - 5.5" (iPhone 8 Plus)
  - iPad Pro 12.9" (if supporting tablets)
- Privacy policy URL (hosted publicly)
- App description and keywords
- Support URL
- Age rating questionnaire completed

**App Store Review Tips:**

- Ensure demo credentials if login required
- All features must be functional
- No placeholder text or "coming soon" features
- Handle all error states gracefully

### Android (Google Play)

```bash
# Build for production (AAB format)
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --latest
```

**Required:**

- Feature graphic (1024x500)
- App icon (512x512)
- Screenshots (phone and tablet)
- Privacy policy URL
- Content rating questionnaire
- Data safety form completed
- Target API level 34+ (Android 14)

**Google Play Data Safety:** When completing the data safety form, declare:

- Account info (email, username)
- User-generated content (messages, posts)
- Device identifiers (for push notifications)

### Post-Submission

1. Monitor review status in App Store Connect / Play Console
2. Respond promptly to any rejection feedback
3. Test TestFlight / Internal testing builds before full release
4. Set up staged rollout for Android (10% → 50% → 100%)

---

## Troubleshooting

### Common Issues

**Metro bundler stuck or stale cache**

```bash
# Clear all caches and restart (recommended first step)
npx expo start --clear

# Full reset for persistent issues
rm -rf node_modules/.cache
pnpm install
npx expo start --clear
```

**"The endpoint is offline" (ngrok/tunnel error)**

```bash
# This means Expo can't reach your backend
# 1. Ensure backend is running
curl http://localhost:4000/api/v1/health

# 2. If using Android emulator, the app auto-converts localhost to 10.0.2.2
# 3. For physical devices, use your LAN IP in app.config.js
```

**API calls fail on Android emulator**

- Android emulator can't access host's `localhost` directly
- The API client automatically uses `10.0.2.2` for Android in development
- Make sure your backend is listening on `0.0.0.0` not just `127.0.0.1`

**iOS build fails**

```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData
cd ios && pod install --repo-update
```

**Android build fails**

```bash
# Clean Gradle
cd android && ./gradlew clean
```

**New Architecture issues (SDK 54+)**

```bash
# If experiencing crashes or rendering issues with the New Architecture:
# 1. Check all native modules are compatible with Fabric/TurboModules
# 2. Some third-party libraries may need updates

# Temporarily disable New Architecture if needed (not recommended):
# In app.json: "newArchEnabled": false
```

**React 19.1 / Suspense issues**

- React 19.1 has stricter Suspense behavior
- Ensure all data-fetching components have Suspense boundaries
- Check React Query v5 compatibility settings

**Push notifications not working**

- Ensure physical device (not simulator)
- Check Expo project ID matches
- Verify notification permissions granted
- Test with Expo's push notification tool first

**WebSocket disconnecting**

- Check network connectivity
- Verify token is valid
- Handle app state changes (foreground/background)

**Biometric authentication not available**

- Device must have biometric hardware (Face ID, Touch ID, fingerprint)
- User must have enrolled at least one biometric in system settings
- Check `biometrics.isAvailable()` before showing the option

### Debug Tools

```typescript
// Enable network logging in development
if (__DEV__) {
  // Note: May not work with New Architecture - use React DevTools instead
  XMLHttpRequest = GLOBAL.originalXMLHttpRequest
    ? GLOBAL.originalXMLHttpRequest
    : GLOBAL.XMLHttpRequest;
}

// React Query focus management
import { focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active');
  });
  return () => subscription.remove();
});
```

### SDK 54 / New Architecture Debugging

```bash
# Check Reanimated worklets are compiling correctly
npx react-native-reanimated-verifier

# Verify New Architecture is active
# In metro bundler output, you should see "Running with New Architecture"

# Profile performance with Systrace (Android)
npx react-native systrace

# Check for bridge messages (should be minimal with New Architecture)
```

### Performance Profiling

```typescript
// Use React DevTools Profiler (built into Expo)
// Press 'j' in Metro to open debugger

// For production profiling, use Sentry or similar
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  tracesSampleRate: 0.1, // 10% of transactions
});
```

---

_Happy mobile development! Built with Expo SDK 54, React Native 0.81, and the New Architecture.
Questions? Open an issue on GitHub._
