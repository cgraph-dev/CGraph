// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider, useTheme } from '../theme-context';

// ── Helpers ────────────────────────────────────────────────────────────

let matchMediaMatches = false;
let _changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

beforeEach(() => {
  matchMediaMatches = false;
  _changeHandler = null;
  localStorage.clear();
  document.documentElement.classList.remove('light', 'dark');

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn(() => ({
      matches: matchMediaMatches,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addEventListener: vi.fn((_: string, handler: any) => {
        _changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    })),
  });
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('ThemeContext', () => {
  describe('ThemeProvider', () => {
    it('renders children', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Hello</div>
        </ThemeProvider>
      );
      expect(screen.getByTestId('child')).toHaveTextContent('Hello');
    });

    it('defaults to dark theme when no stored theme', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('restores theme from localStorage', () => {
      localStorage.setItem('cgraph-theme', 'light');
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('applies class to document.documentElement on mount', () => {
      render(
        <ThemeProvider>
          <div />
        </ThemeProvider>
      );
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('switches from dark to light and updates class', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('cgraph-theme')).toBe('light');
    });

    it('system theme resolves to system preference', () => {
      matchMediaMatches = true; // system prefers dark
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('system theme resolves to light when system prefers light', () => {
      matchMediaMatches = false; // system prefers light
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('persists theme to localStorage on setTheme', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(localStorage.getItem('cgraph-theme')).toBe('light');

      act(() => {
        result.current.setTheme('system');
      });

      expect(localStorage.getItem('cgraph-theme')).toBe('system');
    });
  });

  describe('useTheme', () => {
    it('throws when used outside ThemeProvider', () => {
      // Suppress React error boundary console output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useTheme())).toThrow(
        'useTheme must be used within a ThemeProvider'
      );
      consoleSpy.mockRestore();
    });
  });
});
