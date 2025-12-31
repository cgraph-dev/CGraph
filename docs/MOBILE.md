# CGraph Mobile Guide

> Building native experiences with React Native and Expo.

This guide covers the CGraph mobile application for iOS and Android. Built with React Native and Expo, it shares type definitions and business logic with the web app while delivering a native mobile experience.

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
12. [Testing](#testing)
13. [Building for Production](#building-for-production)
14. [App Store Submission](#app-store-submission)
15. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.73 | Mobile UI framework |
| **Expo** | 50.x | Development toolkit |
| **TypeScript** | 5.x | Type safety |
| **React Navigation** | 6.x | Navigation library |
| **Zustand** | 4.x | State management |
| **React Query** | 5.x | Server state |
| **Phoenix Channels** | 1.7 | Real-time WebSocket |
| **Expo Notifications** | 0.27 | Push notifications |
| **React Native Reanimated** | 3.x | Animations |

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
│   │   └── storage.ts      # Secure storage
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

- Node.js 20+
- pnpm 8+
- iOS: Xcode 15+ (for simulator)
- Android: Android Studio (for emulator)
- Expo Go app on your device (for testing)

### Development Setup

```bash
# From repo root
cd apps/mobile

# Install dependencies
pnpm install

# Start the development server
pnpm start

# Or start for specific platform
pnpm ios      # iOS simulator
pnpm android  # Android emulator
```

### Environment Configuration

```typescript
// src/lib/config.ts
import Constants from 'expo-constants';

const ENV = {
  dev: {
    apiUrl: 'http://localhost:4000',
    wsUrl: 'ws://localhost:4000/socket',
  },
  staging: {
    apiUrl: 'https://staging-api.cgraph.org',
    wsUrl: 'wss://staging-api.cgraph.org/socket',
  },
  production: {
    apiUrl: 'https://api.cgraph.org',
    wsUrl: 'wss://api.cgraph.org/socket',
  },
};

const getEnvVars = () => {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel || 'dev';
  return ENV[releaseChannel as keyof typeof ENV] || ENV.dev;
};

export const config = getEnvVars();
```

### Expo Configuration

```json
// app.json
{
  "expo": {
    "name": "CGraph",
    "slug": "cgraph",
    "version": "1.0.0",
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
  
  return (
    <ThemeContext.Provider value={{ colorScheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
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
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );
    
    // Handle notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        handleNotificationTap(data);
      }
    );
    
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

The mobile app includes a comprehensive animation library at `src/lib/animations.ts` using React Native's Animated API:

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
</AnimatedCard>
```

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

## Testing

### Unit Tests

```typescript
// __tests__/components/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';
import { ThemeProvider } from '@/contexts/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithTheme(
      <Button title="Click me" onPress={() => {}} />
    );
    expect(getByText('Click me')).toBeTruthy();
  });
  
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <Button title="Click me" onPress={onPress} />
    );
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading indicator when loading', () => {
    const { queryByText, getByTestId } = renderWithTheme(
      <Button title="Click me" onPress={() => {}} loading />
    );
    expect(queryByText('Click me')).toBeNull();
  });
});
```

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

### iOS (App Store Connect)

```bash
# Submit to App Store
eas submit --platform ios --latest

# Or specify a build
eas submit --platform ios --id <build-id>
```

**Required Assets:**
- App icon (1024x1024)
- Screenshots for all device sizes
- Privacy policy URL
- App description

### Android (Google Play)

```bash
# Submit to Google Play
eas submit --platform android --latest
```

**Required:**
- Feature graphic (1024x500)
- Screenshots
- Privacy policy
- Content rating questionnaire

---

## Troubleshooting

### Common Issues

**Metro bundler stuck**
```bash
# Clear cache and restart
npx expo start --clear
```

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

**Push notifications not working**
- Ensure physical device (not simulator)
- Check Expo project ID matches
- Verify notification permissions granted

**WebSocket disconnecting**
- Check network connectivity
- Verify token is valid
- Handle app state changes (foreground/background)

### Debug Tools

```typescript
// Enable network logging
if (__DEV__) {
  XMLHttpRequest = GLOBAL.originalXMLHttpRequest ?
    GLOBAL.originalXMLHttpRequest : GLOBAL.XMLHttpRequest;
}

// React Query DevTools (via Flipper)
import { focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active');
  });
  return () => subscription.remove();
});
```

---

*Happy mobile development! Questions? #mobile on Slack.*
