import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── vi.hoisted — available inside hoisted vi.mock factories ────────────

const { authState } = vi.hoisted(() => {
  const authState = {
    isAuthenticated: false,
    user: null as { id: string; isAdmin?: boolean } | null,
  };
  return { authState };
});

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => authState),
}));

vi.mock('react-router-dom', async () => {
  const actual: Record<string, unknown> = { React: null };
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

vi.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

import { ProtectedRoute, PublicRoute, AdminRoute, ProfileRedirectRoute } from '../guards';

// ── Tests ──────────────────────────────────────────────────────────────

beforeEach(() => {
  authState.isAuthenticated = false;
  authState.user = null;
});

describe('Route Guards', () => {
  describe('ProtectedRoute', () => {
    it('redirects to /login when unauthenticated', () => {
      render(
        <ProtectedRoute>
          <div>Protected</div>
        </ProtectedRoute>
      );
      const nav = screen.getByTestId('navigate');
      expect(nav).toHaveAttribute('data-to', '/login');
    });

    it('renders children when authenticated', () => {
      authState.isAuthenticated = true;
      render(
        <ProtectedRoute>
          <div data-testid="content">Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.getByTestId('content')).toHaveTextContent('Protected Content');
    });
  });

  describe('PublicRoute', () => {
    it('renders children when unauthenticated', () => {
      render(
        <PublicRoute>
          <div data-testid="public">Public</div>
        </PublicRoute>
      );
      expect(screen.getByTestId('public')).toBeInTheDocument();
    });

    it('redirects to /messages when authenticated', () => {
      authState.isAuthenticated = true;
      render(
        <PublicRoute>
          <div>Public</div>
        </PublicRoute>
      );
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/messages');
    });
  });

  describe('AdminRoute', () => {
    it('redirects to /login when unauthenticated', () => {
      render(
        <AdminRoute>
          <div>Admin</div>
        </AdminRoute>
      );
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });

    it('redirects to /messages when authenticated but not admin', () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'u1' };
      render(
        <AdminRoute>
          <div>Admin</div>
        </AdminRoute>
      );
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/messages');
    });

    it('renders children when authenticated as admin', () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'u1', isAdmin: true };
      render(
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      );
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  describe('ProfileRedirectRoute', () => {
    it('redirects to /login when unauthenticated', () => {
      render(<ProfileRedirectRoute />);
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });

    it('redirects to user profile when user has id', () => {
      authState.isAuthenticated = true;
      authState.user = { id: 'user-42' };
      render(<ProfileRedirectRoute />);
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/user/user-42');
    });

    it('renders nothing when authenticated but user has no id', () => {
      authState.isAuthenticated = true;
      authState.user = null;
      const { container } = render(<ProfileRedirectRoute />);
      // Component returns null while waiting for user data
      expect(container.innerHTML).toBe('');
    });
  });
});
