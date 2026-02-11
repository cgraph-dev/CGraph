/**
 * Public route definitions
 *
 * Root redirect: authenticated → /messages, unauthenticated → /login.
 * Legal/company pages are served by the landing app at cgraph.org
 * and redirected via Vercel config.
 *
 * @module routes/routeGroups/publicRoutes
 */

import { Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { LoadingSpinner } from '@/components/LoadingSpinner';

/**
 * Root redirect — authenticated users go to /messages,
 * unauthenticated users go to /login.
 */
function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const hasHydrated = useAuthStore.persist?.hasHydrated?.() ?? true;

  if (!hasHydrated || isLoading) {
    return <LoadingSpinner />;
  }

  return <Navigate to={isAuthenticated ? '/messages' : '/login'} replace />;
}

/** Root route — redirects based on auth state */
export function RootRedirectRoute() {
  return <Route path="/" element={<RootRedirect />} />;
}
