# CGraph Frontend Guide

> Building beautiful, fast, and accessible user interfaces with React.

This guide covers the CGraph web application—a React 18 app built with Vite, TypeScript, and TailwindCSS. Whether you're fixing a bug or building a new feature, you'll find everything you need here.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Architecture](#architecture)
5. [State Management](#state-management)
6. [Routing](#routing)
7. [API Integration](#api-integration)
8. [Real-Time Features](#real-time-features)
9. [Component Library](#component-library)
10. [Styling Guide](#styling-guide)
11. [Forms and Validation](#forms-and-validation)
12. [Testing](#testing)
13. [Performance](#performance)
14. [Accessibility](#accessibility)
15. [Common Patterns](#common-patterns)

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2 | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.x | Build tool / dev server |
| **TailwindCSS** | 3.4 | Utility-first styling |
| **Zustand** | 4.5 | Global state management |
| **React Query** | 5.x | Server state / caching |
| **React Router** | 6.22 | Client-side routing |
| **Phoenix Channels** | 1.7 | WebSocket real-time |
| **Wagmi/Viem** | 2.x | Web3 wallet integration |
| **Radix UI** | Latest | Accessible components |
| **Framer Motion** | 11.x | Animations |

---

## Project Structure

```
apps/web/
├── public/              # Static assets (favicon, etc.)
├── src/
│   ├── main.tsx         # Application entry point
│   ├── App.tsx          # Root component with routes
│   ├── index.css        # Global styles / Tailwind imports
│   │
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Base UI primitives (Button, Input, etc.)
│   │   ├── chat/        # Chat-specific components
│   │   ├── common/      # Shared components (Avatar, Modal, etc.)
│   │   └── forms/       # Form components
│   │
│   ├── contexts/        # React Context providers
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── layouts/         # Page layout components
│   │   ├── AppLayout.tsx
│   │   └── AuthLayout.tsx
│   │
│   ├── lib/             # Utility functions and configs
│   │   ├── api.ts       # Axios instance
│   │   ├── socket.ts    # Phoenix socket connection
│   │   └── utils.ts     # Helper functions
│   │
│   ├── pages/           # Page components (route targets)
│   │   ├── auth/        # Login, Register, etc.
│   │   ├── messages/    # Direct messaging
│   │   ├── groups/      # Group channels
│   │   ├── forums/      # Forum posts
│   │   └── settings/    # User settings
│   │
│   ├── stores/          # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   ├── groupStore.ts
│   │   └── forumStore.ts
│   │
│   └── types/           # TypeScript type definitions
│       ├── api.ts
│       └── models.ts
│
├── index.html           # HTML template
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Development Setup

```bash
# From repo root
cd apps/web

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Start dev server
pnpm dev
```

### Environment Variables

```bash
# .env.local
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000/socket
VITE_SENTRY_DSN=          # Optional for dev
VITE_WALLETCONNECT_ID=    # For Web3 features
```

### Available Scripts

```bash
pnpm dev          # Start dev server with HMR
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm test         # Run tests in watch mode
pnpm test:coverage # Run tests with coverage
pnpm lint         # Lint with ESLint
pnpm lint:fix     # Auto-fix lint issues
pnpm typecheck    # Type check without emitting
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │   Pages     │  │   Layouts    │  │     Components         │  │
│  │  (Routes)   │──│  (Wrappers)  │──│  (Reusable UI)         │  │
│  └──────┬──────┘  └──────────────┘  └────────────────────────┘  │
│         │                                                        │
│  ┌──────▼──────────────────────────────────────────────────┐    │
│  │                     Hooks Layer                          │    │
│  │  useAuth | useSocket | useChat | useMediaQuery | etc.   │    │
│  └──────┬──────────────────────────────────────────────────┘    │
│         │                                                        │
│  ┌──────▼──────────────────────────────────────────────────┐    │
│  │                    State Layer                           │    │
│  │    Zustand Stores     │    React Query Cache            │    │
│  │  (auth, UI, socket)   │  (server state, async data)     │    │
│  └──────┬───────────────────────────┬──────────────────────┘    │
│         │                           │                            │
│  ┌──────▼──────────────┐    ┌───────▼───────────────────────┐   │
│  │   Phoenix Socket    │    │      Axios HTTP Client        │   │
│  │   (Real-time)       │    │      (REST API calls)         │   │
│  └─────────────────────┘    └───────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     CGraph Backend API
```

### Data Flow

1. **User Action** → Component event handler
2. **Store Action** → Zustand action or React Query mutation
3. **API Call** → Via axios or socket push
4. **State Update** → Store/cache updated
5. **Re-render** → React re-renders affected components

---

## State Management

We use **Zustand** for global state and **React Query** for server state.

### Zustand Stores

#### Auth Store

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      
      login: async (email, password) => {
        set({ isLoading: true });
        const response = await api.post('/auth/login', { email, password });
        set({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      
      logout: async () => {
        await api.post('/auth/logout');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      updateUser: (data) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...data } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
```

#### Chat Store

```typescript
// src/stores/chatStore.ts
import { create } from 'zustand';

interface ChatState {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  typingUsers: {},
  
  setActiveConversation: (id) => {
    set({ activeConversation: id });
  },
  
  addMessage: (conversationId, message) => {
    const { messages } = get();
    const existing = messages[conversationId] || [];
    set({
      messages: {
        ...messages,
        [conversationId]: [...existing, message],
      },
    });
  },
  
  setTyping: (conversationId, userId, isTyping) => {
    const { typingUsers } = get();
    const current = typingUsers[conversationId] || [];
    const updated = isTyping
      ? [...new Set([...current, userId])]
      : current.filter((id) => id !== userId);
    set({
      typingUsers: {
        ...typingUsers,
        [conversationId]: updated,
      },
    });
  },
}));
```

### React Query for Server State

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
    staleTime: 30 * 1000, // 30 seconds
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
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const { data } = await api.post(`/conversations/${conversationId}/messages`, { content });
      return data.data;
    },
    onSuccess: (newMessage, { conversationId }) => {
      // Optimistically update the cache
      queryClient.setQueryData(['messages', conversationId], (old: Message[] = []) => [
        ...old,
        newMessage,
      ]);
    },
  });
}
```

---

## Routing

We use **React Router v6** with nested routes and lazy loading.

### Route Structure

```tsx
// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load pages
const Messages = lazy(() => import('@/pages/messages/Messages'));
const Groups = lazy(() => import('@/pages/groups/Groups'));
const Forums = lazy(() => import('@/pages/forums/Forums'));
const Settings = lazy(() => import('@/pages/settings/Settings'));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/messages" replace />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:id" element={<Conversation />} />
          <Route path="groups" element={<Groups />} />
          <Route path="groups/:groupId/:channelId?" element={<GroupChannel />} />
          <Route path="forums" element={<Forums />} />
          <Route path="forums/:forumId/posts/:postId" element={<ForumPost />} />
          <Route path="settings/*" element={<Settings />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
```

### Protected Route Pattern

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### Navigation Helpers

```tsx
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

function ChatHeader() {
  const navigate = useNavigate();
  const { id: conversationId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const handleBack = () => navigate(-1);
  const handleSearch = (query: string) => setSearchParams({ q: query });
  
  // ...
}
```

---

## API Integration

### Axios Configuration

```typescript
// src/lib/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await useAuthStore.getState().refreshSession();
        const newToken = useAuthStore.getState().token;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### API Helpers

```typescript
// src/lib/api.ts (continued)

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get('/me'),
};

export const messagesApi = {
  list: (page = 1) =>
    api.get('/conversations', { params: { page } }),
  
  get: (id: string) =>
    api.get(`/conversations/${id}`),
  
  send: (conversationId: string, content: string) =>
    api.post(`/conversations/${conversationId}/messages`, { content }),
};

export const groupsApi = {
  list: () => api.get('/groups'),
  create: (data: CreateGroupData) => api.post('/groups', data),
  join: (code: string) => api.post(`/invites/${code}/join`),
};
```

---

## Real-Time Features

### Phoenix Socket Connection

```typescript
// src/lib/socket.ts
import { Socket, Channel } from 'phoenix';
import { useAuthStore } from '@/stores/authStore';

class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  
  connect() {
    const token = useAuthStore.getState().token;
    if (!token || this.socket?.isConnected()) return;
    
    this.socket = new Socket(import.meta.env.VITE_WS_URL, {
      params: { token },
    });
    
    this.socket.connect();
    
    this.socket.onError(() => {
      console.error('Socket error');
      this.reconnect();
    });
  }
  
  disconnect() {
    this.channels.forEach((channel) => channel.leave());
    this.channels.clear();
    this.socket?.disconnect();
    this.socket = null;
  }
  
  joinChannel(topic: string, params = {}): Channel {
    if (this.channels.has(topic)) {
      return this.channels.get(topic)!;
    }
    
    const channel = this.socket!.channel(topic, params);
    
    channel.join()
      .receive('ok', () => console.log(`Joined ${topic}`))
      .receive('error', (resp) => console.error(`Failed to join ${topic}`, resp));
    
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
  
  private reconnect() {
    setTimeout(() => {
      this.disconnect();
      this.connect();
    }, 5000);
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
import { useAuthStore } from '@/stores/authStore';

export function useChannel(topic: string, params = {}) {
  const channelRef = useRef<Channel | null>(null);
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    socketManager.connect();
    channelRef.current = socketManager.joinChannel(topic, params);
    
    return () => {
      socketManager.leaveChannel(topic);
    };
  }, [topic, isAuthenticated]);
  
  const push = useCallback((event: string, payload = {}) => {
    if (channelRef.current) {
      return channelRef.current.push(event, payload);
    }
  }, []);
  
  const on = useCallback((event: string, callback: (payload: any) => void) => {
    if (channelRef.current) {
      channelRef.current.on(event, callback);
    }
    return () => {
      if (channelRef.current) {
        channelRef.current.off(event, callback);
      }
    };
  }, []);
  
  return { push, on, channel: channelRef.current };
}
```

### Real-Time Messaging Component

```tsx
// src/pages/messages/Conversation.tsx
import { useChannel } from '@/hooks/useSocket';
import { useChatStore } from '@/stores/chatStore';

function Conversation() {
  const { id } = useParams<{ id: string }>();
  const { addMessage, setTyping } = useChatStore();
  const { push, on } = useChannel(`conversation:${id}`);
  
  useEffect(() => {
    const unsubMessage = on('new_message', (payload) => {
      addMessage(id!, payload.message);
    });
    
    const unsubTyping = on('typing', (payload) => {
      setTyping(id!, payload.user_id, true);
      // Clear after 3 seconds
      setTimeout(() => setTyping(id!, payload.user_id, false), 3000);
    });
    
    return () => {
      unsubMessage();
      unsubTyping();
    };
  }, [id, on, addMessage, setTyping]);
  
  const sendMessage = (content: string) => {
    push('new_message', { content })
      .receive('ok', (resp) => console.log('Sent!', resp))
      .receive('error', (err) => console.error('Failed', err));
  };
  
  const sendTyping = () => {
    push('typing', {});
  };
  
  // ...
}
```

---

## Component Library

We build on Radix UI for accessibility and use Tailwind for styling.

### Button Component

```tsx
// src/components/ui/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'bg-dark-700 text-white hover:bg-dark-600',
        outline: 'border border-dark-600 bg-transparent hover:bg-dark-800',
        ghost: 'hover:bg-dark-800',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Input Component

```tsx
// src/components/ui/Input.tsx
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <input
          className={cn(
            'w-full rounded-lg border border-dark-600 bg-dark-800 px-4 py-2',
            'text-white placeholder-gray-500',
            'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### OAuth Components

Social authentication buttons and callback handling for Google, Apple, Facebook, and TikTok.

#### OAuthButtons

```tsx
// src/components/auth/OAuthButtons.tsx
import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaFacebook, FaTiktok } from 'react-icons/fa';
import { oAuthService } from '@/lib/oauth';

interface OAuthButtonsProps {
  mode: 'login' | 'register';
  onError?: (error: string) => void;
}

export function OAuthButtons({ mode, onError }: OAuthButtonsProps) {
  const providers = [
    { id: 'google', name: 'Google', Icon: FcGoogle, color: 'bg-white' },
    { id: 'apple', name: 'Apple', Icon: FaApple, color: 'bg-black' },
    { id: 'facebook', name: 'Facebook', Icon: FaFacebook, color: 'bg-blue-600' },
    { id: 'tiktok', name: 'TikTok', Icon: FaTiktok, color: 'bg-gray-900' },
  ] as const;

  const handleOAuth = async (provider: string) => {
    try {
      await oAuthService.startOAuthFlow(provider);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'OAuth failed');
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-dark-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-dark-900 px-2 text-gray-500">
            Or continue with
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {providers.map(({ id, name, Icon, color }) => (
          <button
            key={id}
            onClick={() => handleOAuth(id)}
            className={`${color} flex h-12 items-center justify-center rounded-lg 
                       transition-all hover:opacity-80`}
            aria-label={`${mode === 'login' ? 'Sign in' : 'Sign up'} with ${name}`}
          >
            <Icon className="h-6 w-6" />
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### OAuthCallback Page

```tsx
// src/pages/auth/OAuthCallback.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { oAuthService } from '@/lib/oauth';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const provider = searchParams.get('provider');

      if (!code || !provider) {
        setError('Missing OAuth parameters');
        return;
      }

      try {
        const result = await oAuthService.handleOAuthCallback(
          provider, code, state || undefined
        );
        setAuth(result.user, result.token);
        navigate('/chat', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuth]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500">Error</h2>
          <p className="text-gray-400">{error}</p>
          <button onClick={() => navigate('/login')} className="mt-4 text-primary-500">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
      <span className="ml-3 text-gray-400">Completing sign in...</span>
    </div>
  );
}
```

#### OAuth Service

```typescript
// src/lib/oauth.ts
import { api } from './api';

class OAuthService {
  async getProviders(): Promise<string[]> {
    const response = await api.get('/auth/oauth');
    return response.data.providers;
  }

  async startOAuthFlow(provider: string): Promise<void> {
    const response = await api.post(`/auth/oauth/${provider}`, {
      redirect_uri: `${window.location.origin}/auth/callback`,
      platform: 'web',
    });
    // Redirect to provider's auth page
    window.location.href = response.data.authorization_url;
  }

  async handleOAuthCallback(
    provider: string,
    code: string,
    state?: string
  ): Promise<{ user: User; token: string }> {
    const response = await api.get(`/auth/oauth/${provider}/callback`, {
      params: { code, state },
    });
    return response.data;
  }

  async linkProvider(provider: string): Promise<void> {
    const response = await api.post(`/auth/oauth/${provider}/link`);
    window.location.href = response.data.authorization_url;
  }

  async unlinkProvider(provider: string): Promise<void> {
    await api.delete(`/auth/oauth/${provider}/link`);
  }
}

export const oAuthService = new OAuthService();
```

### Modal Component

```tsx
// src/components/ui/Modal.tsx
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-md rounded-xl bg-dark-800 p-6 shadow-xl',
            'focus:outline-none',
            className
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-white">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1 text-sm text-gray-400">
              {description}
            </Dialog.Description>
          )}
          
          <div className="mt-4">{children}</div>
          
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Voice Message Components

Components for recording and playing back voice messages:

**VoiceMessageRecorder** - Record audio with live waveform visualization:

```tsx
import { VoiceMessageRecorder } from '@/components';

function ChatInput() {
  const handleVoiceComplete = ({ blob, duration, waveform }) => {
    // Upload and send the voice message
    uploadVoiceMessage(blob, duration, waveform);
  };

  return (
    <VoiceMessageRecorder
      onComplete={handleVoiceComplete}
      onCancel={() => console.log('Recording cancelled')}
      maxDuration={300}
    />
  );
}
```

**VoiceMessagePlayer** - Playback with waveform and seeking:

```tsx
import { VoiceMessagePlayer } from '@/components';

function VoiceMessage({ message }) {
  return (
    <VoiceMessagePlayer
      messageId={message.id}
      audioUrl={message.audio_url}
      duration={message.duration}
      waveformData={message.waveform}
      showDownload
    />
  );
}
```

**Waveform** - Standalone waveform visualization:

```tsx
import { Waveform } from '@/components';

<Waveform
  data={[0.2, 0.5, 0.8, 0.3, 0.6, ...]}
  progress={0.5}
  onSeek={(progress) => seekTo(progress)}
  height={40}
  playedColor="#3b82f6"
  unplayedColor="#d1d5db"
/>
```

### Custom Hooks

Reusable hooks are located in `src/hooks/`:

| Hook | Purpose |
|------|---------|
| `useMediaQuery` | Responsive breakpoint detection |
| `useLocalStorage` | Persist state to localStorage |
| `useDebounce` | Debounce rapidly changing values |
| `useClickOutside` | Detect clicks outside an element |
| `useWindowSize` | Track viewport dimensions |
| `useCopyToClipboard` | Copy text with feedback |

**Example - Responsive design:**

```tsx
import { useMediaQuery, useIsMobile } from '@/hooks';

function Sidebar() {
  const isMobile = useIsMobile();
  const isLargeScreen = useMediaQuery('(min-width: 1280px)');

  if (isMobile) {
    return <MobileDrawer />;
  }

  return <DesktopSidebar expanded={isLargeScreen} />;
}
```

**Example - Debounced search:**

```tsx
import { useDebounce } from '@/hooks';

function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

---

## Styling Guide

### Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        dark: {
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

### CSS Utilities

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Animation Library

The web app includes a comprehensive animation library at `src/lib/animations.ts`:

```typescript
// src/lib/animations.ts
import { easings, durations, fadeIn, slideUp, scaleIn, staggerDelay } from '@/lib/animations';

// Timing functions
easings.easeOut    // 'cubic-bezier(0.16, 1, 0.3, 1)'
easings.spring     // 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
easings.bounce     // 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'

// Duration presets (in ms)
durations.fast     // 150
durations.normal   // 200
durations.slow     // 300

// Animation generators
fadeIn(200)        // { animation: 'fadeIn 200ms ...' }
slideUp(300)       // { animation: 'slideUp 300ms ...' }
scaleIn()          // { animation: 'scaleIn 200ms ...' }

// Staggered list animations
items.map((item, i) => (
  <div style={{ ...slideUp(), ...staggerDelay(i) }}>{item}</div>
))
```

Available keyframes: `fadeIn`, `fadeOut`, `slideUp`, `slideDown`, `slideInRight`, `slideInLeft`, `scaleIn`, `pulse`, `shimmer`

### Common Patterns

```tsx
// Conditional classes
<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes'
)} />

// Responsive design
<div className="flex flex-col md:flex-row lg:gap-8" />

// Dark mode (we're always dark, but if you add light mode)
<div className="bg-white dark:bg-dark-900" />
```

---

## Forms and Validation

We use **Zod** for schema validation and custom form hooks.

### Form Hook

```typescript
// src/hooks/useForm.ts
import { useState, useCallback } from 'react';
import { z } from 'zod';

interface UseFormOptions<T extends z.ZodType> {
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void>;
}

export function useForm<T extends z.ZodType>({ schema, onSubmit }: UseFormOptions<T>) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const setValue = useCallback((field: string, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(result.data);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, schema, onSubmit]);
  
  return { values, errors, setValue, handleSubmit, isSubmitting };
}
```

### Login Form Example

```tsx
// src/pages/auth/Login.tsx
import { z } from 'zod';
import { useForm } from '@/hooks/useForm';
import { useAuthStore } from '@/stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function Login() {
  const { login, error } = useAuthStore();
  
  const { values, errors, setValue, handleSubmit, isSubmitting } = useForm({
    schema: loginSchema,
    onSubmit: async (data) => {
      await login(data.email, data.password);
    },
  });
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={values.email || ''}
        onChange={(e) => setValue('email', e.target.value)}
        error={errors.email}
      />
      
      <Input
        label="Password"
        type="password"
        value={values.password || ''}
        onChange={(e) => setValue('password', e.target.value)}
        error={errors.password}
      />
      
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Login
      </Button>
    </form>
  );
}
```

---

## Testing

We use **Vitest** for unit tests and **Playwright** for E2E tests.

### Unit Test Example

```typescript
// src/stores/authStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import { api } from '@/lib/api';

vi.mock('@/lib/api');

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });
  
  it('should login successfully', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        user: { id: '1', email: 'test@example.com', username: 'test' },
        token: 'jwt-token',
        refresh_token: 'refresh-token',
      },
    });
    
    await useAuthStore.getState().login('test@example.com', 'password');
    
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('test@example.com');
  });
  
  it('should handle login error', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } },
    });
    
    await expect(
      useAuthStore.getState().login('test@example.com', 'wrong')
    ).rejects.toThrow();
    
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().error).toBe('Invalid credentials');
  });
});
```

### Component Test Example

```tsx
// src/components/ui/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick handler', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

## Performance

### Code Splitting

```tsx
// Lazy load heavy components
const EmojiPicker = lazy(() => import('emoji-picker-react'));
const MarkdownEditor = lazy(() => import('@/components/MarkdownEditor'));

function MessageInput() {
  const [showEmoji, setShowEmoji] = useState(false);
  
  return (
    <div>
      {showEmoji && (
        <Suspense fallback={<Spinner />}>
          <EmojiPicker onEmojiClick={handleEmoji} />
        </Suspense>
      )}
    </div>
  );
}
```

### Virtual Lists

```tsx
// src/components/chat/MessageList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <MessageItem message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Memoization

```tsx
// Expensive components
const MessageItem = memo(function MessageItem({ message }: { message: Message }) {
  return (
    <div className="flex gap-2 p-2">
      <Avatar src={message.sender.avatarUrl} />
      <div>
        <span className="font-medium">{message.sender.username}</span>
        <p>{message.content}</p>
      </div>
    </div>
  );
});

// Expensive computations
const sortedMessages = useMemo(
  () => messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  [messages]
);

// Stable callbacks
const handleClick = useCallback(() => {
  setOpen(true);
}, []);
```

---

## Accessibility

### Keyboard Navigation

```tsx
function MessageList() {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        setFocusedIndex((i) => Math.min(i + 1, messages.length - 1));
        break;
      case 'ArrowUp':
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        handleSelect(messages[focusedIndex]);
        break;
    }
  };
  
  return (
    <div role="listbox" onKeyDown={handleKeyDown}>
      {messages.map((msg, i) => (
        <div
          key={msg.id}
          role="option"
          aria-selected={i === focusedIndex}
          tabIndex={i === focusedIndex ? 0 : -1}
        >
          {msg.content}
        </div>
      ))}
    </div>
  );
}
```

### Screen Reader Support

```tsx
// Announce new messages
function useAnnounce() {
  const announce = (message: string) => {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.className = 'sr-only';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  };
  
  return announce;
}

// Usage
const announce = useAnnounce();
useEffect(() => {
  if (newMessage) {
    announce(`New message from ${newMessage.sender.username}`);
  }
}, [newMessage]);
```

---

## Common Patterns

### Optimistic Updates

```tsx
function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages'] });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['messages']);
      
      // Optimistically update
      queryClient.setQueryData(['messages'], (old: Message[]) => [
        ...old,
        { ...newMessage, id: 'temp-' + Date.now(), pending: true },
      ]);
      
      return { previous };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      queryClient.setQueryData(['messages'], context?.previous);
      toast.error('Failed to send message');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
```

### Error Boundaries

```tsx
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to Sentry
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex h-full flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 text-primary-500"
          >
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Debounced Search

```tsx
import { useDebouncedCallback } from 'use-debounce';

function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  
  const search = useDebouncedCallback(async (q: string) => {
    if (q.length < 2) return;
    const { data } = await api.get('/search/users', { params: { q } });
    setResults(data.data);
  }, 300);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    search(e.target.value);
  };
  
  return (
    <div>
      <Input value={query} onChange={handleChange} placeholder="Search users..." />
      <ul>
        {results.map((user) => (
          <li key={user.id}>{user.username}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

*Happy coding! If you have questions, reach out in #frontend on Slack.*
