# How the Frontend Works

Deep dive into the React web app and React Native mobile app.

---

## Web App Architecture

```
apps/web/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base components (Button, Card, etc.)
│   │   ├── Avatar.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts      # Barrel exports
│   │
│   ├── pages/            # Route components
│   │   ├── auth/         # Login, Register
│   │   ├── messages/     # DMs
│   │   ├── groups/       # Discord-like
│   │   ├── forums/       # Reddit-like
│   │   ├── friends/
│   │   ├── settings/
│   │   └── ...
│   │
│   ├── stores/           # Zustand state management
│   │   ├── authStore.ts
│   │   ├── messageStore.ts
│   │   └── ...
│   │
│   ├── lib/              # Utilities
│   │   ├── api.ts        # Axios instance
│   │   ├── socket.ts     # Phoenix channel client
│   │   └── utils.ts
│   │
│   ├── hooks/            # Custom React hooks
│   │
│   ├── contexts/         # React contexts
│   │   └── ThemeContext.tsx
│   │
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── router.tsx        # Route definitions
│
├── public/               # Static assets
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## State Management (Zustand)

Zustand is our state manager. Simple, performant, and TypeScript-friendly.

### Store Structure

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data;
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({ user: null, token: null });
        // Disconnect socket, clear other stores, etc.
      },
      
      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ token: state.token }), // Only persist token
    }
  )
);
```

### Using Stores in Components

```tsx
function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.displayName || '');
  
  const handleSave = async () => {
    await api.put('/me', { display_name: name });
    updateUser({ displayName: name });
  };
  
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

### Our Stores

| Store | Purpose |
|-------|---------|
| `authStore` | User auth, token, profile |
| `messageStore` | Conversations, messages |
| `friendStore` | Friends, friend requests |
| `groupStore` | Groups, channels, members |
| `forumStore` | Forums, posts, comments |
| `notificationStore` | Notifications list |
| `searchStore` | Search state and results |

---

## API Client

```typescript
// lib/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## WebSocket (Phoenix Channels)

```typescript
// lib/socket.ts
import { Socket, Channel } from 'phoenix';
import { useAuthStore } from '@/stores/authStore';

let socket: Socket | null = null;
const channels: Map<string, Channel> = new Map();

export function connectSocket() {
  const token = useAuthStore.getState().token;
  
  if (!token) return null;
  
  socket = new Socket(
    `${import.meta.env.VITE_WS_URL || 'ws://localhost:4000'}/socket`,
    { params: { token } }
  );
  
  socket.connect();
  
  socket.onError(() => console.log('Socket error'));
  socket.onClose(() => console.log('Socket closed'));
  
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    channels.clear();
  }
}

export function joinChannel(topic: string, params = {}): Channel {
  if (!socket) throw new Error('Socket not connected');
  
  // Return existing channel if already joined
  const existing = channels.get(topic);
  if (existing) return existing;
  
  const channel = socket.channel(topic, params);
  
  channel.join()
    .receive('ok', () => console.log(`Joined ${topic}`))
    .receive('error', (reason) => console.log(`Failed to join ${topic}`, reason));
  
  channels.set(topic, channel);
  return channel;
}

export function leaveChannel(topic: string) {
  const channel = channels.get(topic);
  if (channel) {
    channel.leave();
    channels.delete(topic);
  }
}

export function getChannel(topic: string): Channel | undefined {
  return channels.get(topic);
}
```

### Using in Components

```tsx
function ConversationPage({ conversationId }) {
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    const channel = joinChannel(`conversation:${conversationId}`);
    
    // Listen for new messages
    channel.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });
    
    // Listen for typing
    channel.on('user_typing', ({ user_id }) => {
      // Show typing indicator
    });
    
    return () => {
      leaveChannel(`conversation:${conversationId}`);
    };
  }, [conversationId]);
  
  const sendMessage = (content: string) => {
    const channel = getChannel(`conversation:${conversationId}`);
    channel?.push('new_message', { content });
  };
  
  return (/* ... */);
}
```

---

## Routing

```tsx
// router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: '',
        element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
        children: [
          { path: '', element: <Navigate to="/messages" /> },
          { path: 'messages', element: <MessagesPage /> },
          { path: 'messages/:conversationId', element: <ConversationPage /> },
          { path: 'friends', element: <FriendsPage /> },
          { path: 'groups', element: <GroupsPage /> },
          { path: 'groups/:groupId', element: <GroupPage /> },
          { path: 'groups/:groupId/:channelId', element: <ChannelPage /> },
          { path: 'forums', element: <ForumsPage /> },
          { path: 'forums/:slug', element: <ForumPage /> },
          { path: 'forums/:slug/post/:postId', element: <PostPage /> },
          { path: 'settings/*', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
```

---

## Component Patterns

### Base Component Example

```tsx
// components/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all',
          // Size
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          // Variant
          variant === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700',
          variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200',
          variant === 'ghost' && 'text-gray-600 hover:bg-gray-100',
          variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
          // States
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {loading && <Spinner className="mr-2" />}
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
```

### Page Component Example

```tsx
// pages/friends/Friends.tsx
import { useEffect } from 'react';
import { useFriendStore } from '@/stores/friendStore';
import { EmptyState, Avatar, Button } from '@/components';

export default function FriendsPage() {
  const { friends, pendingRequests, isLoading, fetchFriends, fetchPendingRequests } = useFriendStore();
  
  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, []);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-xl font-semibold">Friends</h1>
      </header>
      
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <section className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 mb-3">
            Pending Requests ({pendingRequests.length})
          </h2>
          {pendingRequests.map((request) => (
            <FriendRequestCard key={request.id} request={request} />
          ))}
        </section>
      )}
      
      {/* Friends List */}
      <section className="flex-1 overflow-y-auto p-4">
        {friends.length === 0 ? (
          <EmptyState
            title="No friends yet"
            message="Add friends to start chatting"
          />
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

---

## Styling (Tailwind CSS)

We use Tailwind for all styling. Custom theme defined in `tailwind.config.js`:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          // ... full palette
          600: '#6366f1', // Main brand color
          // ...
        },
        dark: {
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      animation: {
        'fadeIn': 'fadeIn 200ms ease-out',
        'slideUp': 'slideUp 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
};
```

### Dark Mode

```tsx
// contexts/ThemeContext.tsx
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// In components
<div className="bg-white dark:bg-dark-800 text-gray-900 dark:text-white">
```

---

## Mobile App Architecture

```
apps/mobile/
├── src/
│   ├── components/        # Reusable components
│   ├── screens/           # Screen components
│   │   ├── auth/
│   │   ├── messages/
│   │   ├── friends/
│   │   └── ...
│   ├── navigation/        # React Navigation setup
│   ├── lib/               # API, socket, utils
│   ├── contexts/          # Theme, etc.
│   └── types/             # TypeScript types
│
├── App.tsx
├── app.json               # Expo config
└── package.json
```

### Navigation Structure

```tsx
// navigation/index.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Friends" component={FriendsStack} />
      <Tab.Screen name="Groups" component={GroupsStack} />
      <Tab.Screen name="Forums" component={ForumsStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { token } = useAuthStore();
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Mobile-Specific Patterns

```tsx
// Using SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context';

function Screen({ children }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {children}
    </SafeAreaView>
  );
}

// Using KeyboardAvoidingView
import { KeyboardAvoidingView, Platform } from 'react-native';

function ChatInput() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TextInput placeholder="Type a message..." />
    </KeyboardAvoidingView>
  );
}
```

---

## Shared Code (Monorepo Packages)

```
packages/
├── shared-types/     # TypeScript interfaces
├── ui/              # Shared UI components (web + mobile)
├── utils/           # Common utilities
└── config/          # Shared configuration
```

### Using Shared Types

```typescript
// packages/shared-types/src/user.ts
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

// In web or mobile
import { User } from '@cgraph/shared-types';
```

---

## Testing

### Component Tests (Jest + Testing Library)

```tsx
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
  
  it('disables when loading', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Store Tests

```typescript
// stores/authStore.test.ts
import { useAuthStore } from './authStore';
import { api } from '@/lib/api';

jest.mock('@/lib/api');

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });
  
  it('sets user and token on login', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { user: { id: '1' }, token: 'abc' },
    });
    
    await useAuthStore.getState().login('test@example.com', 'password');
    
    expect(useAuthStore.getState().user).toEqual({ id: '1' });
    expect(useAuthStore.getState().token).toBe('abc');
  });
});
```

---

## Build and Deploy

### Web Build

```bash
cd apps/web
pnpm build
# Output in dist/
```

### Mobile Build

```bash
cd apps/mobile

# Development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Production build
eas build --profile production --platform all
```

### Environment Variables

Web uses `VITE_` prefix:
- `VITE_API_URL`
- `VITE_WS_URL`
- `VITE_SENTRY_DSN`

Mobile uses Expo config or `.env`:
- `API_URL`
- `WS_URL`

---

## Debugging Tips

### React DevTools

Install browser extension. Inspect component tree, props, state.

### Network Tab

Check API calls in browser DevTools → Network.

### WebSocket Debugging

In browser console:
```javascript
// See all socket events
socket.onmessage = (e) => console.log('WS:', e.data);
```

### Mobile Debugging

```bash
# Expo DevTools
pnpm start

# Then shake device or press 'm' for menu
# - Debug JS Remotely (Chrome DevTools)
# - Show Element Inspector
```

---

*Last updated: December 31, 2025*
