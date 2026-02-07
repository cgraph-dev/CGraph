/**
 * Application Root
 *
 * Composes the top-level providers, global handlers,
 * and route tree. All lazy page imports, route guards,
 * and auth initialization are delegated to the routes/ module.
 *
 * @module App
 */

import { useEffect, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { IncomingCallHandler } from '@/modules/calls/components/IncomingCallHandler';
import { AuthInitializer } from '@/routes/AuthInitializer';
import { AppRoutes } from '@/routes/AppRoutes';
import '@/themes/theme-globals.css';
import '@/styles/customization-effects.css';

/** Scrolls to top on route navigation */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <AuthInitializer>
      <ScrollToTop />
      <IncomingCallHandler />
      <Suspense fallback={<LoadingSpinner />}>
        <AppRoutes />
      </Suspense>
    </AuthInitializer>
  );
}
