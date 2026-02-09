/**
 * Application Root
 *
 * Composes the top-level providers, global handlers,
 * and route tree. All lazy page imports, route guards,
 * and auth initialization are delegated to the routes/ module.
 *
 * @module App
 */

import { useEffect, useState, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageTransition } from '@/shared/components/PageTransition';
import { IncomingCallHandler } from '@/modules/calls/components/IncomingCallHandler';
import { BackgroundEffectRenderer } from '@/modules/settings/components/BackgroundEffectRenderer';
import { AuthInitializer } from '@/routes/AuthInitializer';
import { AppRoutes } from '@/routes/AppRoutes';
import { QuickSwitcher } from '@/shared/components/QuickSwitcher';
import { KeyboardShortcutsModal } from '@/shared/components/KeyboardShortcutsModal';
import { GroupJoinCelebration } from '@/modules/groups/components/GroupJoinCelebration';
import { useGroupStore } from '@/modules/groups/store';
import { initErrorTracking, reportWebVitals } from '@/lib/error-tracking';
import '@/themes/theme-globals.css';
import '@/styles/customization-effects.css';

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
      <IncomingCallHandler />
      <BackgroundEffectRenderer />
      <QuickSwitcher isOpen={quickSwitcherOpen} onClose={() => setQuickSwitcherOpen(false)} />
      <KeyboardShortcutsModal />
      <GroupJoinCelebration
        groupName={justJoinedGroupName ?? ''}
        show={!!justJoinedGroupName}
        onComplete={clearJoinCelebration}
      />
      <AnimatePresence mode="wait">
        <PageTransition>
          <Suspense fallback={<LoadingSpinner />}>
            <AppRoutes />
          </Suspense>
        </PageTransition>
      </AnimatePresence>
    </AuthInitializer>
  );
}
