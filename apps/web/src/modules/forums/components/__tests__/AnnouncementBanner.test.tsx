import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  FlagIcon: () => <span data-testid="flag-icon" />,
  SpeakerWaveIcon: () => <span data-testid="speaker-icon" />,
  MegaphoneIcon: () => <span data-testid="megaphone-icon" />,
  XMarkIcon: () => <span data-testid="x-icon" />,
}));

describe('AnnouncementBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('module can be imported', async () => {
    const mod = await import('../AnnouncementBanner');
    expect(mod).toBeTruthy();
  });
});
