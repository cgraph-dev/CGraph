/** @module online-status-badge tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnlineStatusBadge } from '../online-status-badge';

vi.mock('@/lib/animation-presets', () => ({
  springs: { bouncy: {} },
}));

vi.mock('../types', () => ({
  statusConfig: {
    online: { color: 'bg-green-500', bgColor: 'bg-green-500/20', label: 'Online' },
    idle: { color: 'bg-yellow-500', bgColor: 'bg-yellow-500/20', label: 'Away' },
    dnd: { color: 'bg-red-500', bgColor: 'bg-red-500/20', label: 'Do Not Disturb' },
    offline: { color: 'bg-gray-400', bgColor: 'bg-gray-400/20', label: 'Offline' },
  },
  glowColors: { online: 'rgba(34,197,94,0.6)' },
  formatLastActiveLong: (ts: string) => `Last active ${ts}`,
}));

describe('OnlineStatusBadge', () => {
  it('renders Online label for online status', () => {
    render(<OnlineStatusBadge status="online" />);
    expect(screen.getByText('Online')).toBeTruthy();
  });

  it('renders Away label for idle status', () => {
    render(<OnlineStatusBadge status="idle" />);
    expect(screen.getByText('Away')).toBeTruthy();
  });

  it('renders Do Not Disturb label for dnd status', () => {
    render(<OnlineStatusBadge status="dnd" />);
    expect(screen.getByText('Do Not Disturb')).toBeTruthy();
  });

  it('renders Offline label for offline status without lastActive', () => {
    render(<OnlineStatusBadge status="offline" />);
    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('renders last active text for offline with lastActive', () => {
    render(<OnlineStatusBadge status="offline" lastActive="2h ago" />);
    expect(screen.getByText('Last active 2h ago')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<OnlineStatusBadge status="online" className="extra" />);
    expect((container.firstChild as HTMLElement).className).toContain('extra');
  });
});
