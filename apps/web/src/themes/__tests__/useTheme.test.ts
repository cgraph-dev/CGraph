import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Hoisted mocks ────────────────────────────────────────────────────

const mockTheme = {
  id: 'default',
  name: 'Default',
  colors: { primary: '#000' },
  typography: {},
  layout: {},
  components: {},
  effects: {},
  accessibility: {},
  category: 'default',
};

const mockMatrixTheme = {
  id: 'matrix',
  name: 'Matrix',
  colors: { primary: '#0f0' },
  typography: {},
  layout: {},
  components: {},
  effects: {},
  accessibility: {},
  category: 'matrix',
};

const {
  mockGetCurrentTheme,
  mockGetAllThemes,
  mockApplyTheme,
  mockGetTheme,
  mockSwitchTheme,
  mockCreateCustomTheme,
  mockExportTheme,
  mockImportTheme,
} = vi.hoisted(() => ({
  mockGetCurrentTheme: vi.fn(),
  mockGetAllThemes: vi.fn(),
  mockApplyTheme: vi.fn(),
  mockGetTheme: vi.fn(),
  mockSwitchTheme: vi.fn(),
  mockCreateCustomTheme: vi.fn(),
  mockExportTheme: vi.fn(),
  mockImportTheme: vi.fn(),
}));

vi.mock('../theme-registry', () => ({
  ThemeRegistry: {
    getCurrentTheme: mockGetCurrentTheme,
    getAllThemes: mockGetAllThemes,
    applyTheme: mockApplyTheme,
    getTheme: mockGetTheme,
    switchTheme: mockSwitchTheme,
    createCustomTheme: mockCreateCustomTheme,
    exportTheme: mockExportTheme,
    importTheme: mockImportTheme,
  },
}));

import { useTheme } from '../useTheme';

// ═══════════════════════════════════════════════════════════════════
// useTheme
// ═══════════════════════════════════════════════════════════════════

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentTheme.mockReturnValue(mockTheme);
    mockGetAllThemes.mockReturnValue([mockTheme, mockMatrixTheme]);
    mockGetTheme.mockImplementation((id: string) =>
      id === 'default' ? mockTheme : id === 'matrix' ? mockMatrixTheme : undefined
    );
    mockApplyTheme.mockReturnValue(true);
    mockSwitchTheme.mockResolvedValue(undefined);
    mockCreateCustomTheme.mockReturnValue({ ...mockTheme, id: 'custom-1' });
    mockExportTheme.mockReturnValue('{"id":"default"}');
    mockImportTheme.mockReturnValue(mockMatrixTheme);
  });

  // ── Initial state ─────────────────────────────────────────────────

  it('returns current theme from registry', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.currentTheme).toEqual(mockTheme);
  });

  it('returns all themes from registry', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.allThemes).toHaveLength(2);
  });

  it('provides setTheme function', () => {
    const { result } = renderHook(() => useTheme());
    expect(typeof result.current.setTheme).toBe('function');
  });

  it('provides switchTheme function', () => {
    const { result } = renderHook(() => useTheme());
    expect(typeof result.current.switchTheme).toBe('function');
  });

  // ── setTheme ──────────────────────────────────────────────────────

  it('calls ThemeRegistry.applyTheme when setTheme is invoked', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('matrix'));
    expect(mockApplyTheme).toHaveBeenCalledWith('matrix');
  });

  it('updates currentTheme after successful applyTheme', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('matrix'));
    expect(result.current.currentTheme).toEqual(mockMatrixTheme);
  });

  it('does not update theme when applyTheme returns false', () => {
    mockApplyTheme.mockReturnValue(false);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('nonexistent'));
    expect(result.current.currentTheme).toEqual(mockTheme);
  });

  it('does not update theme when getTheme returns undefined', () => {
    mockApplyTheme.mockReturnValue(true);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('nonexistent'));
    expect(result.current.currentTheme).toEqual(mockTheme);
  });

  // ── switchTheme ───────────────────────────────────────────────────

  it('calls ThemeRegistry.switchTheme with current theme id', async () => {
    const { result } = renderHook(() => useTheme());
    await act(async () => result.current.switchTheme('matrix'));
    expect(mockSwitchTheme).toHaveBeenCalledWith('default', 'matrix', undefined);
  });

  it('passes custom duration to switchTheme', async () => {
    const { result } = renderHook(() => useTheme());
    await act(async () => result.current.switchTheme('matrix', 500));
    expect(mockSwitchTheme).toHaveBeenCalledWith('default', 'matrix', 500);
  });

  it('updates currentTheme after switchTheme', async () => {
    const { result } = renderHook(() => useTheme());
    await act(async () => result.current.switchTheme('matrix'));
    expect(result.current.currentTheme).toEqual(mockMatrixTheme);
  });

  // ── createCustomTheme ─────────────────────────────────────────────

  it('calls ThemeRegistry.createCustomTheme', () => {
    const { result } = renderHook(() => useTheme());
    const overrides = { name: 'My Theme' };
    act(() => {
      result.current.createCustomTheme('default', overrides);
    });
    expect(mockCreateCustomTheme).toHaveBeenCalledWith('default', overrides);
  });

  it('returns the custom theme from createCustomTheme', () => {
    const { result } = renderHook(() => useTheme());
    let custom: unknown;
    act(() => {
      custom = result.current.createCustomTheme('default', {});
    });
    expect(custom).toEqual({ ...mockTheme, id: 'custom-1' });
  });

  it('refreshes allThemes after createCustomTheme', () => {
    const updatedThemes = [mockTheme, mockMatrixTheme, { ...mockTheme, id: 'custom-1' }];
    mockGetAllThemes.mockReturnValue(updatedThemes);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.createCustomTheme('default', {}));
    expect(result.current.allThemes).toHaveLength(3);
  });

  // ── exportTheme ───────────────────────────────────────────────────

  it('exports current theme as JSON string', () => {
    const { result } = renderHook(() => useTheme());
    const json = result.current.exportTheme();
    expect(mockExportTheme).toHaveBeenCalledWith('default');
    expect(json).toBe('{"id":"default"}');
  });

  // ── importTheme ───────────────────────────────────────────────────

  it('imports a theme from JSON', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.importTheme('{"id":"new"}'));
    expect(mockImportTheme).toHaveBeenCalledWith('{"id":"new"}');
  });

  it('refreshes allThemes after import', () => {
    const updatedThemes = [mockTheme, mockMatrixTheme, { id: 'imported' }];
    mockGetAllThemes.mockReturnValue(updatedThemes);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.importTheme('{}'));
    expect(result.current.allThemes).toHaveLength(3);
  });

  it('rethrows errors from importTheme', () => {
    mockImportTheme.mockImplementation(() => {
      throw new Error('Invalid JSON');
    });
    const { result } = renderHook(() => useTheme());
    expect(() => result.current.importTheme('bad')).toThrow('Invalid JSON');
  });

  // ── isThemeApplied ────────────────────────────────────────────────

  it('returns true when checking current theme id', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isThemeApplied('default')).toBe(true);
  });

  it('returns false for a different theme id', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isThemeApplied('matrix')).toBe(false);
  });

  it('updates isThemeApplied after setTheme', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('matrix'));
    expect(result.current.isThemeApplied('matrix')).toBe(true);
    expect(result.current.isThemeApplied('default')).toBe(false);
  });

  // ── themechange event listener ────────────────────────────────────

  it('updates currentTheme on themechange custom event', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: mockMatrixTheme } }));
    });
    expect(result.current.currentTheme).toEqual(mockMatrixTheme);
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useTheme());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('themechange', expect.any(Function));
    removeSpy.mockRestore();
  });
});
