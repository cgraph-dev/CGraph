/**
 * usePageTransition
 *
 * Hook that exposes the current route transition state.
 * Tracks `location.key` changes to signal enter/exit phases,
 * letting consumers coordinate side-effects with route animations.
 *
 * @module shared/hooks/usePageTransition
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { durations } from '@cgraph/animation-constants';

type TransitionPhase = 'idle' | 'entering' | 'exiting';

interface UsePageTransitionResult {
  /** Current animation phase */
  phase: TransitionPhase;
  /** Whether any transition is in progress */
  isTransitioning: boolean;
  /** Current location key used as the motion key */
  locationKey: string;
  /** Manually signal exit completion (for imperative control) */
  completeTransition: () => void;
}

/**
 * Monitors route changes and returns the current transition phase.
 *
 * @example
 * ```tsx
 * const { phase, isTransitioning } = usePageTransition();
 * // Pause heavy renders while transitioning
 * if (isTransitioning) return <Skeleton />;
 * ```
 */
export function usePageTransition(): UsePageTransitionResult {
  const location = useLocation();
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const prevKeyRef = useRef(location.key);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const completeTransition = useCallback(() => {
    setPhase('idle');
  }, []);

  useEffect(() => {
    if (location.key !== prevKeyRef.current) {
      // Route changed — mark as entering
      setPhase('entering');
      prevKeyRef.current = location.key;

      // Auto-complete after the page-enter animation duration
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPhase('idle');
      }, durations.normal.ms);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [location.key]);

  return {
    phase,
    isTransitioning: phase !== 'idle',
    locationKey: location.key ?? location.pathname,
    completeTransition,
  };
}

export default usePageTransition;
