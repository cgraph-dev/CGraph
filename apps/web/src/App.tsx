/**
 * Application Root
 *
 * Composes the top-level providers, global handlers,
 * and route tree. All lazy page imports, route guards,
 * and auth initialization are delegated to the routes/ module.
 *
 * @module App
 */

import { useEffect, useState, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/shared/components/PageTransition';
import { AuthInitializer } from '@/routes/AuthInitializer';
import { AppRoutes } from '@/routes/AppRoutes';
import { useGroupStore } from '@/modules/groups/store';
import { initErrorTracking, reportWebVitals } from '@/lib/error-tracking';
import '@/themes/theme-globals.css';
import '@/styles/customization-effects.css';

// Lazy-load non-critical global components to reduce initial bundle
const IncomingCallHandler = lazy(() =>
  import('@/modules/calls/components/IncomingCallHandler').then((m) => ({
    default: m.IncomingCallHandler,
  }))
);
const BackgroundEffectRenderer = lazy(() =>
  import('@/modules/settings/components/BackgroundEffectRenderer').then((m) => ({
    default: m.BackgroundEffectRenderer,
  }))
);
const QuickSwitcher = lazy(() =>
  import('@/shared/components/QuickSwitcher').then((m) => ({ default: m.QuickSwitcher }))
);
const KeyboardShortcutsModal = lazy(() =>
  import('@/shared/components/KeyboardShortcutsModal').then((m) => ({
    default: m.KeyboardShortcutsModal,
  }))
);
const GroupJoinCelebration = lazy(() =>
  import('@/modules/groups/components/GroupJoinCelebration').then((m) => ({
    default: m.GroupJoinCelebration,
  }))
);
const PushNotificationPrompt = lazy(() =>
  import('@/shared/components/PushNotificationPrompt').then((m) => ({
    default: m.PushNotificationPrompt,
  }))
);

// Initialize error tracking on module load
initErrorTracking();
reportWebVitals();

/** Scrolls to top on route navigation */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export default function App() {
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false);
  const justJoinedGroupName = useGroupStore((s) => s.justJoinedGroupName);
  const clearJoinCelebration = useGroupStore((s) => s.clearJoinCelebration);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickSwitcherOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <AuthInitializer>
      <ScrollToTop />
      <Suspense fallback={null}>
        <IncomingCallHandler />
        <BackgroundEffectRenderer />
        <QuickSwitcher isOpen={quickSwitcherOpen} onClose={() => setQuickSwitcherOpen(false)} />
        <KeyboardShortcutsModal />
        <GroupJoinCelebration
          groupName={justJoinedGroupName ?? ''}
          show={!!justJoinedGroupName}
          onComplete={clearJoinCelebration}
        />
        <PushNotificationPrompt />
      </Suspense>
      <AnimatePresence mode="wait">
        <PageTransition>
          <Suspense fallback={null}>
            <AppRoutes />
          </Suspense>
        </PageTransition>
      </AnimatePresence>
    </AuthInitializer>
  );
}
