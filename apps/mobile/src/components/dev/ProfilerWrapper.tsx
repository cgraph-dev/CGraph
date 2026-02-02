/**
 * React Profiler Wrapper Component (Mobile)
 *
 * A development utility component that wraps children with React's Profiler
 * API to measure rendering performance in React Native. Logs render timings
 * and can be used to identify performance bottlenecks.
 *
 * @module components/dev/ProfilerWrapper
 * @since v0.7.29
 */

import React, { Profiler, ProfilerOnRenderCallback, useCallback, useRef } from 'react';

interface RenderMetric {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  timestamp: number;
}

interface ProfilerWrapperProps {
  /** Unique identifier for this profiler instance */
  id: string;
  /** Children to profile */
  children: React.ReactNode;
  /** Whether to log metrics to console (default: true in __DEV__) */
  logToConsole?: boolean;
  /** Threshold in ms - only log renders exceeding this duration */
  thresholdMs?: number;
  /** Custom callback for render metrics */
  onRender?: (metric: RenderMetric) => void;
  /** Whether profiling is enabled (default: true in __DEV__) */
  enabled?: boolean;
  /** Maximum metrics to keep in memory */
  maxMetrics?: number;
}

// In-memory metrics storage for debugging
const metricsStore: Map<string, RenderMetric[]> = new Map();

/**
 * Get collected metrics for a profiler ID
 */
export function getProfilerMetrics(id: string): RenderMetric[] {
  return metricsStore.get(id) || [];
}

/**
 * Clear collected metrics for a profiler ID or all metrics
 */
export function clearProfilerMetrics(id?: string): void {
  if (id) {
    metricsStore.delete(id);
  } else {
    metricsStore.clear();
  }
}

/**
 * Get summary statistics for a profiler ID
 */
export function getProfilerStats(id: string): {
  count: number;
  avgActualDuration: number;
  maxActualDuration: number;
  avgBaseDuration: number;
  mountCount: number;
  updateCount: number;
} | null {
  const metrics = metricsStore.get(id);
  if (!metrics || metrics.length === 0) return null;

  const mountMetrics = metrics.filter((m) => m.phase === 'mount');
  const updateMetrics = metrics.filter((m) => m.phase === 'update');

  const totalActual = metrics.reduce((sum, m) => sum + m.actualDuration, 0);
  const totalBase = metrics.reduce((sum, m) => sum + m.baseDuration, 0);
  const maxActual = Math.max(...metrics.map((m) => m.actualDuration));

  return {
    count: metrics.length,
    avgActualDuration: totalActual / metrics.length,
    maxActualDuration: maxActual,
    avgBaseDuration: totalBase / metrics.length,
    mountCount: mountMetrics.length,
    updateCount: updateMetrics.length,
  };
}

// @ts-expect-error - __DEV__ is a React Native global
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

/**
 * ProfilerWrapper component that measures render performance.
 *
 * Features:
 * - Wraps children with React.Profiler
 * - Configurable threshold for logging slow renders
 * - Stores metrics in memory for later analysis
 * - Custom callback support for analytics integration
 * - Automatically disabled in production by default
 *
 * @example
 * ```tsx
 * <ProfilerWrapper id="MessageList" thresholdMs={16}>
 *   <MessageList messages={messages} />
 * </ProfilerWrapper>
 * ```
 */
export function ProfilerWrapper({
  id,
  children,
  logToConsole = isDev,
  thresholdMs = 0,
  onRender,
  enabled = isDev,
  maxMetrics = 100,
}: ProfilerWrapperProps): React.ReactElement {
  const metricsRef = useRef<RenderMetric[]>([]);

  const handleRender: ProfilerOnRenderCallback = useCallback(
    (
      profilerId: string,
      phase: 'mount' | 'update' | 'nested-update',
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number
    ) => {
      const metric: RenderMetric = {
        id: profilerId,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        timestamp: Date.now(),
      };

      // Store metric
      metricsRef.current.push(metric);
      if (metricsRef.current.length > maxMetrics) {
        metricsRef.current.shift();
      }

      // Update global store
      const stored = metricsStore.get(profilerId) || [];
      stored.push(metric);
      if (stored.length > maxMetrics) {
        stored.shift();
      }
      metricsStore.set(profilerId, stored);

      // Log if above threshold
      if (logToConsole && actualDuration >= thresholdMs) {
        const icon = actualDuration > 16 ? '🔴' : actualDuration > 8 ? '🟡' : '🟢';
        console.log(
          `${icon} [Profiler] ${profilerId} ${phase} in ${actualDuration.toFixed(2)}ms (base: ${baseDuration.toFixed(2)}ms)`
        );
      }

      // Call custom callback
      onRender?.(metric);
    },
    [logToConsole, thresholdMs, onRender, maxMetrics]
  );

  // Bypass profiler in production unless explicitly enabled
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
}

/**
 * Higher-order component version of ProfilerWrapper
 */
export function withProfiler<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  id: string,
  options?: Omit<ProfilerWrapperProps, 'id' | 'children'>
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithProfiler: React.FC<P> = (props) => (
    <ProfilerWrapper id={id} {...options}>
      <WrappedComponent {...props} />
    </ProfilerWrapper>
  );

  WithProfiler.displayName = `withProfiler(${displayName})`;

  return WithProfiler;
}

/**
 * Hook to access profiler metrics for a component
 */
export function useProfilerMetrics(id: string) {
  return {
    getMetrics: () => getProfilerMetrics(id),
    getStats: () => getProfilerStats(id),
    clear: () => clearProfilerMetrics(id),
  };
}

export default ProfilerWrapper;
