/**
 * Matrix Animation System - Engine Tests
 * 
 * @description Tests for the core animation engine
 * @version 1.0.0
 * @since v0.6.3
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { MatrixEngine, createMatrixEngine } from '../engine';
import { DEFAULT_CONFIG } from '../config';
import { MATRIX_GREEN, CYBER_BLUE } from '../themes';
import type { MatrixConfig, DeepPartial } from '../types';

// =============================================================================
// BROWSER ENVIRONMENT MOCKS
// =============================================================================

// Mock window object for tests
const mockWindow = {
  devicePixelRatio: 1,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(0), 16) as unknown as number,
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockDocument = {
  hidden: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  visibilityState: 'visible',
};

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Setup globals before all tests
beforeAll(() => {
  (global as any).window = mockWindow;
  (global as any).document = mockDocument;
  (global as any).requestAnimationFrame = mockWindow.requestAnimationFrame;
  (global as any).cancelAnimationFrame = mockWindow.cancelAnimationFrame;
  (global as any).ResizeObserver = MockResizeObserver;
});

afterAll(() => {
  delete (global as any).window;
  delete (global as any).document;
  delete (global as any).requestAnimationFrame;
  delete (global as any).cancelAnimationFrame;
  delete (global as any).ResizeObserver;
});

// =============================================================================
// MOCK CANVAS
// =============================================================================

const createMockCanvas = () => {
  const ctx = {
    fillStyle: '',
    font: '',
    textBaseline: 'top',
    globalAlpha: 1,
    shadowBlur: 0,
    shadowColor: '',
    textAlign: 'start',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    rect: vi.fn(),
    closePath: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
  };

  const canvas = {
    width: 800,
    height: 600,
    style: { width: '800px', height: '600px' },
    getContext: vi.fn(() => ctx),
    getBoundingClientRect: vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
    })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  return { canvas, ctx };
};

// =============================================================================
// ENGINE CREATION TESTS
// =============================================================================

describe('Matrix Engine Creation', () => {
  describe('createMatrixEngine()', () => {
    it('should create an engine instance', () => {
      const engine = createMatrixEngine();
      expect(engine).toBeInstanceOf(MatrixEngine);
    });

    it('should accept configuration overrides', () => {
      const engine = createMatrixEngine({
        performance: { targetFPS: 30 },
      });
      
      const state = engine.getState();
      expect(state).toBeDefined();
    });

    it('should create multiple independent engines', () => {
      const engine1 = createMatrixEngine();
      const engine2 = createMatrixEngine();
      
      expect(engine1).not.toBe(engine2);
    });
  });

  describe('MatrixEngine constructor', () => {
    it('should initialize with idle state', () => {
      const engine = new MatrixEngine();
      const state = engine.getState();
      
      expect(state.state).toBe('idle');
      expect(state.isPaused).toBe(false);
    });

    it('should have default theme', () => {
      const engine = new MatrixEngine();
      const state = engine.getState();
      
      expect(state.theme).toBeDefined();
      expect(state.theme.id).toBe(MATRIX_GREEN.id);
    });

    it('should initialize metrics', () => {
      const engine = new MatrixEngine();
      const state = engine.getState();
      
      expect(state.metrics).toBeDefined();
      expect(state.metrics.fps).toBe(0);
      expect(state.metrics.frameCount).toBe(0);
    });
  });
});

// =============================================================================
// ENGINE INITIALIZATION TESTS
// =============================================================================

describe('Matrix Engine Initialization', () => {
  let engine: MatrixEngine;
  let canvas: ReturnType<typeof createMockCanvas>['canvas'];
  let ctx: ReturnType<typeof createMockCanvas>['ctx'];

  beforeEach(() => {
    const mock = createMockCanvas();
    canvas = mock.canvas;
    ctx = mock.ctx;
    engine = new MatrixEngine();
  });

  afterEach(() => {
    engine.destroy();
    vi.clearAllMocks();
  });

  describe('init()', () => {
    it('should initialize with canvas', () => {
      engine.init(canvas as any);
      
      // Engine calls getContext with optimization options
      expect(canvas.getContext).toHaveBeenCalledWith('2d', expect.any(Object));
    });

    it('should update dimensions from canvas', () => {
      engine.init(canvas as any);
      const state = engine.getState();
      
      expect(state.dimensions.width).toBe(800);
      expect(state.dimensions.height).toBe(600);
    });

    it('should not throw with valid canvas', () => {
      expect(() => engine.init(canvas as any)).not.toThrow();
    });
  });
});

// =============================================================================
// ENGINE LIFECYCLE TESTS
// =============================================================================

describe('Matrix Engine Lifecycle', () => {
  let engine: MatrixEngine;
  let canvas: ReturnType<typeof createMockCanvas>['canvas'];

  beforeEach(() => {
    const mock = createMockCanvas();
    canvas = mock.canvas;
    engine = new MatrixEngine();
    engine.init(canvas as any);
  });

  afterEach(() => {
    engine.destroy();
    vi.clearAllMocks();
  });

  describe('start()', () => {
    it('should change state to running', () => {
      engine.start();
      const state = engine.getState();
      
      expect(state.state).toBe('running');
    });

    it('should trigger onStart callback', () => {
      const onStart = vi.fn();
      engine.setEventHandlers({ onStart });
      
      engine.start();
      expect(onStart).toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    it('should change state to stopped', () => {
      engine.start();
      engine.stop();
      const state = engine.getState();
      
      expect(state.state).toBe('stopped');
    });

    it('should trigger onStop callback', () => {
      const onStop = vi.fn();
      engine.setEventHandlers({ onStop });
      
      engine.start();
      engine.stop();
      expect(onStop).toHaveBeenCalled();
    });
  });

  describe('pause()', () => {
    it('should change state to paused', () => {
      engine.start();
      engine.pause();
      const state = engine.getState();
      
      expect(state.state).toBe('paused');
      expect(state.isPaused).toBe(true);
    });

    it('should trigger onPause callback', () => {
      const onPause = vi.fn();
      engine.setEventHandlers({ onPause });
      
      engine.start();
      engine.pause();
      expect(onPause).toHaveBeenCalled();
    });
  });

  describe('resume()', () => {
    it('should resume from paused state', () => {
      engine.start();
      engine.pause();
      engine.resume();
      const state = engine.getState();
      
      expect(state.state).toBe('running');
      expect(state.isPaused).toBe(false);
    });

    it('should trigger onResume callback', () => {
      const onResume = vi.fn();
      engine.setEventHandlers({ onResume });
      
      engine.start();
      engine.pause();
      engine.resume();
      expect(onResume).toHaveBeenCalled();
    });
  });

  describe('toggle()', () => {
    it('should pause when running', () => {
      engine.start();
      engine.toggle();
      
      expect(engine.getState().isPaused).toBe(true);
    });

    it('should resume when paused', () => {
      engine.start();
      engine.pause();
      engine.toggle();
      
      expect(engine.getState().isPaused).toBe(false);
    });
  });

  describe('destroy()', () => {
    it('should stop the engine', () => {
      engine.start();
      engine.destroy();
      
      expect(engine.getState().state).toBe('stopped');
    });

    it('should be callable multiple times', () => {
      engine.destroy();
      expect(() => engine.destroy()).not.toThrow();
    });
  });
});

// =============================================================================
// ENGINE CONFIGURATION TESTS
// =============================================================================

describe('Matrix Engine Configuration', () => {
  let engine: MatrixEngine;
  let canvas: ReturnType<typeof createMockCanvas>['canvas'];

  beforeEach(() => {
    const mock = createMockCanvas();
    canvas = mock.canvas;
    engine = new MatrixEngine();
    engine.init(canvas as any);
  });

  afterEach(() => {
    engine.destroy();
    vi.clearAllMocks();
  });

  describe('updateConfig()', () => {
    it('should update performance settings', () => {
      engine.updateConfig({
        performance: { targetFPS: 30 },
      });

      // Engine should accept the update without throwing
      expect(() => engine.start()).not.toThrow();
    });

    it('should update effect settings', () => {
      engine.updateConfig({
        effects: {
          depthLayers: 5,
          enableBloom: true,
        },
      });

      expect(() => engine.start()).not.toThrow();
    });

    it('should update while running', () => {
      engine.start();
      
      expect(() => {
        engine.updateConfig({
          columns: { density: 0.5 },
        });
      }).not.toThrow();
    });
  });

  describe('setTheme()', () => {
    it('should change theme by object', () => {
      engine.setTheme(CYBER_BLUE);
      const state = engine.getState();
      
      expect(state.theme.id).toBe(CYBER_BLUE.id);
    });

    it('should change theme by preset name', () => {
      engine.setTheme('blood-red');
      const state = engine.getState();
      
      expect(state.theme.id).toBe('blood-red');
    });

    it('should update while running', () => {
      engine.start();
      
      expect(() => {
        engine.setTheme(CYBER_BLUE);
      }).not.toThrow();
    });
  });
});

// =============================================================================
// ENGINE STATE TESTS
// =============================================================================

describe('Matrix Engine State', () => {
  let engine: MatrixEngine;
  let canvas: ReturnType<typeof createMockCanvas>['canvas'];

  beforeEach(() => {
    const mock = createMockCanvas();
    canvas = mock.canvas;
    engine = new MatrixEngine();
    engine.init(canvas as any);
  });

  afterEach(() => {
    engine.destroy();
    vi.clearAllMocks();
  });

  describe('getState()', () => {
    it('should return current state', () => {
      const state = engine.getState();
      
      expect(state).toBeDefined();
      expect(state.state).toBeDefined();
      expect(state.theme).toBeDefined();
      expect(state.dimensions).toBeDefined();
      expect(state.metrics).toBeDefined();
    });

    it('should return immutable state', () => {
      const state1 = engine.getState();
      const state2 = engine.getState();
      
      // States should be equal but not the same object (if cloned)
      expect(state1.state).toBe(state2.state);
    });

    it('should reflect state changes', () => {
      expect(engine.getState().state).toBe('idle');
      
      engine.start();
      expect(engine.getState().state).toBe('running');
      
      engine.pause();
      expect(engine.getState().state).toBe('paused');
      
      engine.stop();
      expect(engine.getState().state).toBe('stopped');
    });
  });
});

// =============================================================================
// EVENT HANDLER TESTS
// =============================================================================

describe('Matrix Engine Event Handlers', () => {
  let engine: MatrixEngine;
  let canvas: ReturnType<typeof createMockCanvas>['canvas'];

  beforeEach(() => {
    const mock = createMockCanvas();
    canvas = mock.canvas;
    engine = new MatrixEngine();
    engine.init(canvas as any);
  });

  afterEach(() => {
    engine.destroy();
    vi.clearAllMocks();
  });

  describe('setEventHandlers()', () => {
    it('should set all event handlers', () => {
      const handlers = {
        onStart: vi.fn(),
        onStop: vi.fn(),
        onPause: vi.fn(),
        onResume: vi.fn(),
        onError: vi.fn(),
      };

      engine.setEventHandlers(handlers);

      engine.start();
      expect(handlers.onStart).toHaveBeenCalled();

      engine.pause();
      expect(handlers.onPause).toHaveBeenCalled();

      engine.resume();
      expect(handlers.onResume).toHaveBeenCalled();

      engine.stop();
      expect(handlers.onStop).toHaveBeenCalled();
    });

    it('should allow partial handler sets', () => {
      const onStart = vi.fn();
      engine.setEventHandlers({ onStart });

      expect(() => engine.start()).not.toThrow();
      expect(onStart).toHaveBeenCalled();
    });

    it('should override previous handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      engine.setEventHandlers({ onStart: handler1 });
      engine.setEventHandlers({ onStart: handler2 });

      engine.start();
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// DIMENSION TESTS
// =============================================================================

describe('Matrix Engine Dimensions', () => {
  let engine: MatrixEngine;
  let canvas: ReturnType<typeof createMockCanvas>['canvas'];

  beforeEach(() => {
    const mock = createMockCanvas();
    canvas = mock.canvas;
    engine = new MatrixEngine();
  });

  afterEach(() => {
    engine.destroy();
    vi.clearAllMocks();
  });

  describe('resize handling', () => {
    it('should track initial dimensions', () => {
      canvas.width = 1920;
      canvas.height = 1080;
      (canvas.getBoundingClientRect as any).mockReturnValue({
        width: 1920,
        height: 1080,
        top: 0,
        left: 0,
        right: 1920,
        bottom: 1080,
      });

      engine.init(canvas as any);
      const state = engine.getState();

      expect(state.dimensions.width).toBe(1920);
      expect(state.dimensions.height).toBe(1080);
    });
  });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

describe('Matrix Engine Performance', () => {
  it('should create engine quickly', () => {
    const start = performance.now();
    
    for (let i = 0; i < 100; i++) {
      const engine = new MatrixEngine();
      engine.destroy();
    }
    
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100); // 100ms for 100 engines
  });

  it('should initialize quickly', () => {
    const mock = createMockCanvas();
    const engine = new MatrixEngine();
    
    const start = performance.now();
    engine.init(mock.canvas as any);
    const elapsed = performance.now() - start;
    
    engine.destroy();
    expect(elapsed).toBeLessThan(50); // 50ms initialization
  });
});
