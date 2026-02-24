/**
 * @file Tests for GroupJoinCelebration component
 * @module groups/components/group-join-celebration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...rest }: Record<string, unknown>) => (
      <div className={className as string}>{children as React.ReactNode}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock animation presets
vi.mock('@/lib/animation-presets', () => ({
  springs: {
    bouncy: { type: 'spring', stiffness: 300, damping: 20 },
  },
}));

import { GroupJoinCelebration } from '../group-join-celebration';
import confetti from 'canvas-confetti';

describe('GroupJoinCelebration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(confetti).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when show is false', () => {
    const { container } = render(<GroupJoinCelebration groupName="Devs" show={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders welcome text when show is true', () => {
    render(<GroupJoinCelebration groupName="Awesome Devs" show />);
    expect(screen.getByText('Welcome to')).toBeInTheDocument();
  });

  it('renders group name', () => {
    render(<GroupJoinCelebration groupName="Awesome Devs" show />);
    expect(screen.getByText('Awesome Devs')).toBeInTheDocument();
  });

  it('renders celebration emoji', () => {
    render(<GroupJoinCelebration groupName="Devs" show />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('fires confetti when shown', () => {
    render(<GroupJoinCelebration groupName="Devs" show />);
    expect(confetti).toHaveBeenCalled();
  });

  it('fires side bursts after 200ms', () => {
    render(<GroupJoinCelebration groupName="Devs" show />);
    // Initial call is the center burst
    const initialCalls = vi.mocked(confetti).mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // After 200ms, two side bursts fire
    expect(vi.mocked(confetti).mock.calls.length).toBe(initialCalls + 2);
  });

  it('calls onComplete after ~2500ms', () => {
    const onComplete = vi.fn();
    render(<GroupJoinCelebration groupName="Devs" show onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('does not fire confetti when show is false', () => {
    render(<GroupJoinCelebration groupName="Devs" show={false} />);
    expect(confetti).not.toHaveBeenCalled();
  });

  it('renders backdrop overlay when shown', () => {
    const { container } = render(<GroupJoinCelebration groupName="Devs" show />);
    expect(container.innerHTML).toContain('bg-black/30');
  });

  it('renders with pointer-events-none', () => {
    const { container } = render(<GroupJoinCelebration groupName="Devs" show />);
    expect(container.innerHTML).toContain('pointer-events-none');
  });
});
