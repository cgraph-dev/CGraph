/**
 * Test Utilities for CGraph Mobile
 *
 * Reusable rendering helpers, mock providers, and testing utilities.
 * Wraps components with necessary context providers for isolated testing.
 *
 * @since v0.7.28
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider as _AuthProvider } from '../contexts/AuthContext';
import { E2EEProvider } from '../lib/crypto/E2EEContext';
import type { User as _User } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Test user type with required fields for testing.
 * Aligned with the backend User type but with test-friendly defaults.
 */
interface TestUser {
  id: string;
  email: string;
  username: string | null;
  user_id: number;
  user_id_display: string;
  display_name?: string;
  avatar_url?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';
  can_change_username: boolean;
  inserted_at: string;
  updated_at: string;
  is_anonymous?: boolean;
  is_premium?: boolean;
  bio?: string;
  karma?: number;
  is_verified?: boolean;
}

interface MockAuthContextValue {
  user: TestUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: jest.Mock;
  register: jest.Mock;
  logout: jest.Mock;
  updateUser: jest.Mock;
  refreshUser: jest.Mock;
}

interface WrapperOptions {
  /** Initial authenticated user for tests */
  user?: TestUser | null;
  /** Authentication token */
  token?: string | null;
  /** Skip auth provider (for auth-screen testing) */
  skipAuth?: boolean;
  /** Skip E2EE provider */
  skipE2EE?: boolean;
  /** Skip navigation container */
  skipNavigation?: boolean;
  /** Initial navigation state */
  navigationState?: object;
  /** Custom query client options */
  queryClientOptions?: object;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapperOptions?: WrapperOptions;
}

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Creates a mock user object for testing
 */
export function createMockUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 'user-test-123',
    email: 'test@example.com',
    username: 'testuser',
    user_id: 12345,
    user_id_display: '#12345',
    display_name: 'Test User',
    avatar_url: undefined,
    status: 'online',
    can_change_username: true,
    inserted_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    is_anonymous: false,
    is_premium: false,
    ...overrides,
  };
}

/**
 * Creates a mock message object for testing
 */
export function createMockMessage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'msg-test-123',
    content: 'Test message content',
    sender_id: 'user-test-123',
    conversation_id: 'conv-test-123',
    encrypted: false,
    created_at: '2026-01-08T12:00:00Z',
    updated_at: '2026-01-08T12:00:00Z',
    ...overrides,
  };
}

/**
 * Creates a mock conversation object for testing
 */
export function createMockConversation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'conv-test-123',
    type: 'direct',
    participants: [createMockUser()],
    last_message: createMockMessage(),
    unread_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-08T12:00:00Z',
    ...overrides,
  };
}

/**
 * Creates a mock friend object for testing
 */
export function createMockFriend(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'friend-test-123',
    user: createMockUser({ id: 'friend-user-123', username: 'frienduser' }),
    status: 'accepted',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Creates a mock group object for testing
 */
export function createMockGroup(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'group-test-123',
    name: 'Test Group',
    description: 'A test group',
    avatar_url: null,
    member_count: 5,
    is_public: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-08T12:00:00Z',
    ...overrides,
  };
}

// ============================================================================
// Mock Context Providers
// ============================================================================

/**
 * Creates a mock AuthContext for testing
 */
function createMockAuthContext(options: WrapperOptions = {}): MockAuthContextValue {
  return {
    user: options.user ?? null,
    token: options.token ?? null,
    isLoading: false,
    isAuthenticated: !!(options.user && options.token),
    login: jest.fn().mockResolvedValue(undefined),
    register: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    updateUser: jest.fn(),
    refreshUser: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Mock AuthContext provider for testing
 */
const MockAuthContext = React.createContext<MockAuthContextValue | null>(null);

function MockAuthProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MockAuthContextValue;
}) {
  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

// ============================================================================
// Test Query Client
// ============================================================================

/**
 * Creates a QueryClient configured for testing
 */
function createTestQueryClient(options: object = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    ...options,
  });
}

// ============================================================================
// All Providers Wrapper
// ============================================================================

/**
 * Wraps components with all necessary providers for testing
 */
function AllProviders({
  children,
  options = {},
}: {
  children: ReactNode;
  options?: WrapperOptions;
}) {
  const queryClient = createTestQueryClient(options.queryClientOptions);
  const mockAuth = createMockAuthContext(options);

  let wrapped = children;

  // E2EE Provider (innermost, optional)
  if (!options.skipE2EE) {
    wrapped = <E2EEProvider>{wrapped}</E2EEProvider>;
  }

  // Auth Provider
  if (!options.skipAuth) {
    wrapped = <MockAuthProvider value={mockAuth}>{wrapped}</MockAuthProvider>;
  }

  // Theme Provider
  wrapped = <ThemeProvider>{wrapped}</ThemeProvider>;

  // Query Client Provider
  wrapped = <QueryClientProvider client={queryClient}>{wrapped}</QueryClientProvider>;

  // Navigation Container (optional)
  if (!options.skipNavigation) {
    wrapped = <NavigationContainer>{wrapped}</NavigationContainer>;
  }

  // Safe Area Provider
  wrapped = <SafeAreaProvider>{wrapped}</SafeAreaProvider>;

  // Gesture Handler Root
  wrapped = <GestureHandlerRootView style={{ flex: 1 }}>{wrapped}</GestureHandlerRootView>;

  return <>{wrapped}</>;
}

// ============================================================================
// Custom Render Function
// ============================================================================

/**
 * Custom render function that wraps components with test providers
 *
 * @example
 * ```tsx
 * // Basic render
 * const { getByText } = renderWithProviders(<MyComponent />);
 *
 * // With authenticated user
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   wrapperOptions: {
 *     user: createMockUser(),
 *     token: 'test-token',
 *   },
 * });
 *
 * // Without navigation (for isolated component tests)
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   wrapperOptions: { skipNavigation: true },
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): ReturnType<typeof render> {
  const { wrapperOptions, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => <AllProviders options={wrapperOptions}>{children}</AllProviders>,
    ...renderOptions,
  });
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Waits for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Flushes all pending promises in the queue
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Waits for React state updates to complete
 */
export async function waitForStateUpdate(): Promise<void> {
  await flushPromises();
  await delay(0);
}

// ============================================================================
// Mock Response Helpers
// ============================================================================

/**
 * Creates a successful API response structure
 */
export function createApiResponse<T>(data: T, meta: object = {}) {
  return {
    data: {
      data,
      ...meta,
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  };
}

/**
 * Creates an error API response structure
 */
export function createApiError(
  message: string,
  status = 400,
  details: Record<string, string[]> = {}
) {
  return {
    response: {
      data: {
        error: message,
        message,
        details,
      },
      status,
      statusText: status === 401 ? 'Unauthorized' : 'Bad Request',
    },
    message: `Request failed with status code ${status}`,
  };
}

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Creates a mock navigation prop for screen testing
 */
export function createMockNavigation() {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    dispatch: jest.fn(),
    setParams: jest.fn(),
    getParent: jest.fn(() => null),
    getState: jest.fn(() => ({ routes: [], index: 0 })),
  };
}

/**
 * Creates a mock route prop for screen testing
 */
export function createMockRoute<T extends object = object>(name: string, params: T = {} as T) {
  return {
    key: `${name}-key`,
    name,
    params,
  };
}

// ============================================================================
// Re-exports
// ============================================================================

export * from '@testing-library/react-native';
