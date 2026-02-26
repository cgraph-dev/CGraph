import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  StarIcon: () => <span data-testid="star-icon" />,
  TrophyIcon: () => <span data-testid="trophy-icon" />,
  ChevronUpIcon: () => <span data-testid="up-icon" />,
  ChevronDownIcon: () => <span data-testid="down-icon" />,
}));

describe('LeaderboardWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('module can be imported', async () => {
    const mod = await import('../leaderboard-widget');
    expect(mod).toBeTruthy();
  });
});
