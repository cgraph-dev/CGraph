/**
 * Matrix Performance Monitoring Hook
 *
 * @description Monitors animation performance for the Matrix animation system.
 *
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 */

import { useRef, useEffect, useState } from 'react';
import type { MatrixEngineState } from './types';

/**
 * Hook for monitoring animation performance
 *
 * @param engineState - Current engine state
 * @returns Performance metrics
 */
export function useMatrixPerformance(engineState: MatrixEngineState) {
  const [avgFps, setAvgFps] = useState(0);
  const fpsHistory = useRef<number[]>([]);

  useEffect(() => {
    fpsHistory.current.push(engineState.metrics.fps);

    if (fpsHistory.current.length > 60) {
      fpsHistory.current.shift();
    }

    const avg =
      fpsHistory.current.reduce((a: number, b: number) => a + b, 0) / fpsHistory.current.length;
    setAvgFps(Math.round(avg));
  }, [engineState.metrics.fps]);

  const isPerformanceGood = avgFps >= 50;
  const isPerformanceOk = avgFps >= 30;

  return {
    currentFps: engineState.metrics.fps,
    averageFps: avgFps,
    frameTime: engineState.metrics.frameTime,
    activeColumns: engineState.metrics.activeColumns,
    totalCharacters: engineState.metrics.totalCharacters,
    isPerformanceGood,
    isPerformanceOk,
    performanceLevel: isPerformanceGood ? 'good' : isPerformanceOk ? 'ok' : 'poor',
  };
}
