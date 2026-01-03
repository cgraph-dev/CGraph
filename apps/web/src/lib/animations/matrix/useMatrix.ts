/**
 * Matrix Cipher Background Animation - React Hook
 * 
 * @description Custom React hook for integrating the Matrix animation engine.
 * Provides a declarative API for controlling the animation lifecycle.
 * 
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { canvasRef, start, stop, setTheme } = useMatrix({
 *     autoStart: true,
 *     theme: 'cyber-blue',
 *   });
 *   
 *   return <canvas ref={canvasRef} className="fixed inset-0" />;
 * }
 * ```
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type {
  MatrixConfig,
  MatrixTheme,
  MatrixEngineState,
  UseMatrixOptions,
  UseMatrixReturn,
  ThemePreset,
  DeepPartial,
} from './types';
import { MatrixEngine, createMatrixEngine } from './engine';
import { getTheme, THEME_REGISTRY } from './themes';
import { createConfig } from './config';

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * React hook for Matrix cipher background animation
 * 
 * @param options - Configuration options
 * @returns Control object with refs and methods
 */
export function useMatrix(options: UseMatrixOptions = {}): UseMatrixReturn {
  const {
    config: initialConfig,
    autoStart = false,
    pauseOnHidden = true,
    events,
    canvasRef: externalCanvasRef,
  } = options;
  
  // Create internal canvas ref if not provided externally
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  
  // Engine instance ref
  const engineRef = useRef<MatrixEngine | null>(null);
  
  // Resolve initial theme (must be a complete MatrixTheme, not DeepPartial)
  const resolvedTheme = useMemo((): MatrixTheme => {
    if (initialConfig?.theme && typeof initialConfig.theme === 'object' && 'id' in initialConfig.theme) {
      // If a full theme object is provided with id, use it
      return initialConfig.theme as MatrixTheme;
    }
    // Fall back to default theme
    return THEME_REGISTRY['matrix-green'];
  }, [initialConfig?.theme]);
  
  // State
  const [state, setState] = useState<MatrixEngineState>(() => ({
    state: 'idle',
    theme: resolvedTheme,
    columns: [],
    dimensions: { width: 0, height: 0, pixelRatio: 1 },
    metrics: {
      fps: 0,
      frameTime: 0,
      activeColumns: 0,
      totalCharacters: 0,
      lastFrameTimestamp: 0,
      frameCount: 0,
    },
    isPaused: false,
    isVisible: true,
  }));
  
  // Create configuration
  const config = useMemo(() => {
    return createConfig(initialConfig);
  }, [initialConfig]);
  
  // =========================================================================
  // ENGINE LIFECYCLE
  // =========================================================================
  
  /**
   * Initialize the engine
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create engine instance
    const engine = createMatrixEngine(config);
    engineRef.current = engine;
    
    // Set event handlers
    engine.setEventHandlers({
      onStart: () => {
        setState(prev => ({ ...prev, state: 'running', isPaused: false }));
        events?.onStart?.();
      },
      onStop: () => {
        setState(prev => ({ ...prev, state: 'stopped' }));
        events?.onStop?.();
      },
      onPause: () => {
        setState(prev => ({ ...prev, state: 'paused', isPaused: true }));
        events?.onPause?.();
      },
      onResume: () => {
        setState(prev => ({ ...prev, state: 'running', isPaused: false }));
        events?.onResume?.();
      },
      onError: (error) => {
        events?.onError?.(error);
      },
    });
    
    // Initialize with canvas
    try {
      engine.init(canvas);
      
      if (autoStart) {
        engine.start();
      }
    } catch (error) {
      console.error('Failed to initialize Matrix engine:', error);
      events?.onError?.(error as Error);
    }
    
    // Cleanup on unmount
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [canvasRef]); // Only re-init if canvas ref changes
  
  /**
   * Handle visibility changes
   */
  useEffect(() => {
    if (!pauseOnHidden) return;
    
    const handleVisibilityChange = () => {
      const engine = engineRef.current;
      if (!engine) return;
      
      const currentState = engine.getState();
      
      if (document.hidden && currentState.state === 'running') {
        engine.pause();
        setState(prev => ({ ...prev, isVisible: false }));
      } else if (!document.hidden && currentState.isPaused && currentState.isVisible !== false) {
        engine.resume();
        setState(prev => ({ ...prev, isVisible: true }));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseOnHidden]);
  
  /**
   * Sync state with engine periodically
   */
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const engine = engineRef.current;
      if (engine) {
        const engineState = engine.getState();
        setState(prev => ({
          ...prev,
          metrics: engineState.metrics,
          theme: engineState.theme,
        }));
      }
    }, 500); // Sync every 500ms
    
    return () => clearInterval(syncInterval);
  }, []);
  
  // =========================================================================
  // CONTROL METHODS
  // =========================================================================
  
  /**
   * Start the animation
   */
  const start = useCallback(() => {
    engineRef.current?.start();
  }, []);
  
  /**
   * Stop the animation
   */
  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);
  
  /**
   * Pause the animation
   */
  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);
  
  /**
   * Resume the animation
   */
  const resume = useCallback(() => {
    engineRef.current?.resume();
  }, []);
  
  /**
   * Toggle pause/resume
   */
  const toggle = useCallback(() => {
    engineRef.current?.toggle();
  }, []);
  
  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates: DeepPartial<MatrixConfig>) => {
    engineRef.current?.updateConfig(updates);
  }, []);
  
  /**
   * Change theme
   */
  const setTheme = useCallback((theme: MatrixTheme | ThemePreset) => {
    if (typeof theme === 'string') {
      engineRef.current?.setTheme(getTheme(theme));
    } else {
      engineRef.current?.setTheme(theme);
    }
    setState(prev => ({
      ...prev,
      theme: typeof theme === 'string' ? getTheme(theme) : theme,
    }));
  }, []);
  
  // =========================================================================
  // DERIVED STATE
  // =========================================================================
  
  const isRunning = state.state === 'running';
  const isPaused = state.isPaused;
  const fps = state.metrics.fps;
  
  return {
    canvasRef,
    state,
    start,
    stop,
    pause,
    resume,
    toggle,
    updateConfig,
    setTheme,
    isRunning,
    isPaused,
    fps,
  };
}

// =============================================================================
// ADDITIONAL HOOKS
// =============================================================================

/**
 * Hook for theme selection
 * 
 * @returns Theme utilities
 */
export function useMatrixThemes() {
  const themes = useMemo(() => {
    return Object.entries(THEME_REGISTRY).map(([key, theme]) => ({
      id: key as ThemePreset,
      name: theme.name,
      primaryColor: theme.primaryColor,
      theme,
    }));
  }, []);
  
  const getThemeById = useCallback((id: ThemePreset): MatrixTheme => {
    return getTheme(id);
  }, []);
  
  return {
    themes,
    getTheme: getThemeById,
    defaultTheme: THEME_REGISTRY['matrix-green'],
  };
}

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
    
    const avg = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;
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

export default useMatrix;
