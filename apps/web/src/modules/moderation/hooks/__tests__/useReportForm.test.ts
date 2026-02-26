// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * useReportForm Hook Tests
 *
 * Tests for the report form hook: category selection, step navigation,
 * submission via mutation, and handleClose reset.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React from 'react';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '@/lib/api';
import { useReportForm, REPORT_CATEGORIES } from '../useReportForm';
import type { ReportCategory, TargetType } from '../useReportForm';

// ── Test wrapper with QueryClientProvider ────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ── REPORT_CATEGORIES constant ───────────────────────────────────────

describe('REPORT_CATEGORIES', () => {
  it('has at least 10 categories', () => {
    expect(REPORT_CATEGORIES.length).toBeGreaterThanOrEqual(10);
  });

  it('each category has value, label, and description', () => {
    for (const cat of REPORT_CATEGORIES) {
      expect(cat).toHaveProperty('value');
      expect(cat).toHaveProperty('label');
      expect(cat).toHaveProperty('description');
      expect(typeof cat.value).toBe('string');
      expect(typeof cat.label).toBe('string');
      expect(typeof cat.description).toBe('string');
    }
  });

  it('includes key categories', () => {
    const values = REPORT_CATEGORIES.map((c) => c.value);
    expect(values).toContain('harassment');
    expect(values).toContain('spam');
    expect(values).toContain('hate_speech');
    expect(values).toContain('other');
  });

  it('has unique values', () => {
    const values = REPORT_CATEGORIES.map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

// ── useReportForm hook ───────────────────────────────────────────────

describe('useReportForm', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with step=category, no selected category, empty description', () => {
    const { result } = renderHook(() => useReportForm('user', 'user-1', onClose), {
      wrapper: createWrapper(),
    });

    expect(result.current.step).toBe('category');
    expect(result.current.selectedCategory).toBeNull();
    expect(result.current.description).toBe('');
  });

  it('setSelectedCategory updates the category', () => {
    const { result } = renderHook(() => useReportForm('message', 'msg-1', onClose), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedCategory('spam');
    });

    expect(result.current.selectedCategory).toBe('spam');
  });

  it('setStep navigates between steps', () => {
    const { result } = renderHook(() => useReportForm('user', 'user-1', onClose), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setStep('details');
    });
    expect(result.current.step).toBe('details');

    act(() => {
      result.current.setStep('category');
    });
    expect(result.current.step).toBe('category');
  });

  it('setDescription updates the description', () => {
    const { result } = renderHook(() => useReportForm('user', 'user-1', onClose), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setDescription('This user is spamming');
    });
    expect(result.current.description).toBe('This user is spamming');
  });

  it('handleSubmit does nothing when no category is selected', () => {
    const { result } = renderHook(() => useReportForm('user', 'user-1', onClose), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleSubmit();
    });

    // api.post should NOT have been called
    expect(api.post).not.toHaveBeenCalled();
  });

  it('handleSubmit triggers mutation with correct payload', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'report-1' } });

    const { result } = renderHook(() => useReportForm('message', 'msg-42', onClose), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedCategory('harassment');
      result.current.setDescription('Targeted abuse');
    });

    act(() => {
      result.current.handleSubmit();
    });

    // Wait for mutation
    await vi.waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/v1/reports', {
        report: {
          target_type: 'message',
          target_id: 'msg-42',
          category: 'harassment',
          description: 'Targeted abuse',
        },
      });
    });
  });

  it('handleSubmit omits description when empty', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'report-2' } });

    const { result } = renderHook(() => useReportForm('user', 'user-1', onClose), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedCategory('spam');
    });

    act(() => {
      result.current.handleSubmit();
    });

    await vi.waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/v1/reports', {
        report: {
          target_type: 'user',
          target_id: 'user-1',
          category: 'spam',
          description: undefined,
        },
      });
    });
  });

  it('handleClose resets all state and calls onClose', () => {
    const { result } = renderHook(() => useReportForm('user', 'user-1', onClose), {
      wrapper: createWrapper(),
    });

    // Set some state first
    act(() => {
      result.current.setSelectedCategory('scam');
      result.current.setDescription('Scam content');
      result.current.setStep('details');
    });

    act(() => {
      result.current.handleClose();
    });

    expect(result.current.step).toBe('category');
    expect(result.current.selectedCategory).toBeNull();
    expect(result.current.description).toBe('');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('works with different target types', () => {
    const targetTypes: TargetType[] = ['user', 'message', 'group', 'forum', 'post', 'comment'];

    for (const tt of targetTypes) {
      const { result } = renderHook(() => useReportForm(tt, `${tt}-1`, onClose), {
        wrapper: createWrapper(),
      });
      expect(result.current.step).toBe('category');
    }
  });
});
