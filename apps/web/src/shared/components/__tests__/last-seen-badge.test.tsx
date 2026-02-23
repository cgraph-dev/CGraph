/** @module last-seen-badge tests */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LastSeenBadge } from '../last-seen-badge';

describe('LastSeenBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows Online when isOnline is true', () => {
    render(<LastSeenBadge isOnline />);
    expect(screen.getByText('Online')).toBeTruthy();
  });

  it('shows Online when status is online', () => {
    render(<LastSeenBadge status="online" />);
    expect(screen.getByText('Online')).toBeTruthy();
  });

  it('shows Do Not Disturb for dnd status', () => {
    render(<LastSeenBadge status="dnd" />);
    expect(screen.getByText('Do Not Disturb')).toBeTruthy();
  });

  it('shows Idle for idle status', () => {
    render(<LastSeenBadge status="idle" />);
    expect(screen.getByText('Idle')).toBeTruthy();
  });

  it('shows Offline for invisible status', () => {
    render(<LastSeenBadge status="invisible" />);
    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('shows Offline when no lastSeenAt provided', () => {
    render(<LastSeenBadge />);
    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('shows "just now" for recent timestamps', () => {
    const thirtySecondsAgo = new Date('2025-06-15T11:59:30Z').toISOString();
    render(<LastSeenBadge lastSeenAt={thirtySecondsAgo} />);
    expect(screen.getByText('Last seen just now')).toBeTruthy();
  });

  it('shows minutes ago', () => {
    const tenMinutesAgo = new Date('2025-06-15T11:50:00Z').toISOString();
    render(<LastSeenBadge lastSeenAt={tenMinutesAgo} />);
    expect(screen.getByText('Last seen 10m ago')).toBeTruthy();
  });

  it('shows hours ago', () => {
    const threeHoursAgo = new Date('2025-06-15T09:00:00Z').toISOString();
    render(<LastSeenBadge lastSeenAt={threeHoursAgo} />);
    expect(screen.getByText('Last seen 3h ago')).toBeTruthy();
  });

  it('shows days ago', () => {
    const twoDaysAgo = new Date('2025-06-13T12:00:00Z').toISOString();
    render(<LastSeenBadge lastSeenAt={twoDaysAgo} />);
    expect(screen.getByText('Last seen 2d ago')).toBeTruthy();
  });

  it('shows weeks ago', () => {
    const twoWeeksAgo = new Date('2025-06-01T12:00:00Z').toISOString();
    render(<LastSeenBadge lastSeenAt={twoWeeksAgo} />);
    expect(screen.getByText('Last seen 2w ago')).toBeTruthy();
  });

  it('shows formatted date for old timestamps', () => {
    const monthsAgo = new Date('2025-01-01T12:00:00Z').toISOString();
    render(<LastSeenBadge lastSeenAt={monthsAgo} />);
    // formatLastSeen returns date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    expect(screen.getByText(/Last seen/)).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<LastSeenBadge isOnline className="custom-class" />);
    expect((container.firstChild as HTMLElement).className).toContain('custom-class');
  });
});
