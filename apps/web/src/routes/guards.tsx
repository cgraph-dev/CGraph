/**
 * Route Guards
 *
 * Authentication and authorization wrappers for React Router routes.
 * Each guard checks auth state and redirects accordingly.
 *
 * @module routes/guards
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { routeLogger } from '@/lib/logger';

/**
 * Requires authentication — redirects to /login if unauthenticated.
 * Waits for auth store rehydration before deciding, to avoid
 * a premature redirect that would flash the login page.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const hasHydrated = useAuthStore.persist?.hasHydrated?.() ?? true;
  routeLogger.debug('ProtectedRoute isAuthenticated:', isAuthenticated, 'hydrated:', hasHydrated);

  // Wait for Zustand persist to rehydrate before making a redirect decision
  if (!hasHydrated || isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * Public-only route — redirects authenticated users to /messages.
 * Waits for auth rehydration to avoid redirect flicker.
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const hasHydrated = useAuthStore.persist?.hasHydrated?.() ?? true;
  routeLogger.debug('PublicRoute isAuthenticated:', isAuthenticated, 'hydrated:', hasHydrated);

  if (!hasHydrated) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/messages" replace />;
  }
  return <>{children}</>;
}

/**
 * Requires admin role — redirects non-admins to /messages.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!user?.isAdmin) {
    return <Navigate to="/messages" replace />;
  }
  return <>{children}</>;
}

/**
 * Redirects to the authenticated user's profile page.
 * Shows a spinner while the user object is loading.
 */
export function ProfileRedirectRoute() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.id) {
    return <Navigate to={`/user/${user.id}`} replace />;
  }
  return <LoadingSpinner />;
}
