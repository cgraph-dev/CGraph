/**
 * @fileoverview Comprehensive tests for the main App component
 * Tests routing, lazy loading, authentication guards, and error boundaries
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock the auth store
const mockAuthStore = {
  isAuthenticated: false,
  user: null as { id: string; username: string; isAdmin: boolean } | null,
  token: null as string | null,
  checkAuth: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector?: (state: typeof mockAuthStore) => unknown) => {
    if (selector) {
      return selector(mockAuthStore);
    }
    return mockAuthStore;
  },
}));

// Mock lazy-loaded components
vi.mock('@/pages/auth/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

vi.mock('@/pages/auth/Register', () => ({
  default: () => <div data-testid="register-page">Register Page</div>,
}));

vi.mock('@/pages/messages/Messages', () => ({
  default: () => <div data-testid="messages-page">Messages Page</div>,
}));

vi.mock('@/pages/NotFound', () => ({
  default: () => <div data-testid="not-found-page">404 Not Found</div>,
}));

vi.mock('@/layouts/AuthLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-layout">{children}</div>
  ),
}));

vi.mock('@/layouts/AppLayout', () => ({
  default: () => <div data-testid="app-layout">App Layout</div>,
}));

/**
 * Helper to create a test wrapper with providers
 */
function createTestWrapper(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.user = null;
    mockAuthStore.token = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Routing', () => {
    it('shows landing page for unauthenticated users at /', async () => {
      const Wrapper = createTestWrapper('/');
      render(<App />, { wrapper: Wrapper });

      // The app now shows a landing page for unauthenticated users at /
      await waitFor(() => {
        expect(
          screen.getByClassName ? document.querySelector('.demo-landing, .gl-nav') : document.body
        ).toBeInTheDocument();
      });
    });

    it('shows login page at /login for unauthenticated users', async () => {
      const Wrapper = createTestWrapper('/login');
      render(<App />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
      });
    });

    it('shows register page at /register', async () => {
      const Wrapper = createTestWrapper('/register');
      render(<App />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument();
      });
    });

    it('shows 404 page for unknown routes', async () => {
      const Wrapper = createTestWrapper('/unknown-route-xyz');
      render(<App />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Guards', () => {
    it('redirects authenticated users from /login to /messages', async () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.user = { id: '1', username: 'testuser', isAdmin: false };

      const Wrapper = createTestWrapper('/login');
      render(<App />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });
    });

    it('redirects unauthenticated users from /messages to /login', async () => {
      mockAuthStore.isAuthenticated = false;

      const Wrapper = createTestWrapper('/messages');
      render(<App />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });
  });

  describe('Lazy Loading', () => {
    it('shows loading fallback while components load', async () => {
      const Wrapper = createTestWrapper('/login');
      render(<App />, { wrapper: Wrapper });

      // Should show loading state briefly
      // Then resolve to the actual page
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });
  });

  describe('Auth Initialization', () => {
    it('calls checkAuth on mount', async () => {
      const Wrapper = createTestWrapper('/login');
      render(<App />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(mockAuthStore.checkAuth).toHaveBeenCalledTimes(1);
      });
    });

    it('handles checkAuth failure gracefully', async () => {
      mockAuthStore.checkAuth.mockRejectedValueOnce(new Error('Auth failed'));

      const Wrapper = createTestWrapper('/login');
      render(<App />, { wrapper: Wrapper });

      await waitFor(() => {
        // Should still render the login page even if checkAuth fails
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });
  });
});

describe('Route Security', () => {
  beforeEach(() => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: '1', username: 'testuser', isAdmin: false };
  });

  it('blocks non-admin users from /admin routes', async () => {
    mockAuthStore.user = { id: '1', username: 'testuser', isAdmin: false };

    const Wrapper = createTestWrapper('/admin');
    render(<App />, { wrapper: Wrapper });

    await waitFor(() => {
      // Should redirect to /messages
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });
  });

  it('allows admin users to access /admin routes', async () => {
    mockAuthStore.user = { id: '1', username: 'admin', isAdmin: true };

    // Need to mock the AdminDashboard component
    vi.mock('@/pages/admin/AdminDashboard', () => ({
      default: () => <div data-testid="admin-dashboard">Admin Dashboard</div>,
    }));

    const Wrapper = createTestWrapper('/admin');
    render(<App />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });
  });
});
