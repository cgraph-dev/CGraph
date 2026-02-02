import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('useLocalStorage', () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => mockStorage[key] || null
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
      delete mockStorage[key];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should return stored value from localStorage', () => {
    mockStorage['test-key'] = JSON.stringify('stored-value');

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('should write to localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('write-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    // Check that localStorage was updated
    expect(mockStorage['write-key']).toBe(JSON.stringify('updated'));
  });

  it('should handle object values in localStorage', () => {
    mockStorage['object-key'] = JSON.stringify({ name: 'stored', count: 5 });

    const { result } = renderHook(() =>
      useLocalStorage('object-key', { name: 'default', count: 0 })
    );

    expect(result.current[0]).toEqual({ name: 'stored', count: 5 });
  });

  it('should handle array values in localStorage', () => {
    mockStorage['array-key'] = JSON.stringify([4, 5, 6]);

    const { result } = renderHook(() => useLocalStorage('array-key', [1, 2, 3]));

    expect(result.current[0]).toEqual([4, 5, 6]);
  });

  it('should remove value from localStorage', () => {
    mockStorage['remove-key'] = JSON.stringify('to-remove');

    const { result } = renderHook(() => useLocalStorage('remove-key', 'default'));

    expect(result.current[0]).toBe('to-remove');

    act(() => {
      result.current[2](); // removeValue
    });

    expect(mockStorage['remove-key']).toBeUndefined();
  });

  it('should handle boolean values', () => {
    mockStorage['bool-key'] = JSON.stringify(true);

    const { result } = renderHook(() => useLocalStorage('bool-key', false));

    expect(result.current[0]).toBe(true);
  });

  it('should call setValue with correct value', () => {
    const { result } = renderHook(() => useLocalStorage('test', 0));

    act(() => {
      result.current[1](42);
    });

    expect(mockStorage['test']).toBe(JSON.stringify(42));
  });
});
