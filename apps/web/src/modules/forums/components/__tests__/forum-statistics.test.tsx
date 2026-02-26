import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
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
  ChartBarIcon: () => <span data-testid="chart-icon" />,
  UserGroupIcon: () => <span data-testid="users-icon" />,
  DocumentTextIcon: () => <span data-testid="doc-icon" />,
  ChatBubbleLeftRightIcon: () => <span data-testid="chat-icon" />,
  EyeIcon: () => <span data-testid="eye-icon" />,
  ArrowTrendingUpIcon: () => <span data-testid="trend-icon" />,
}));

describe('ForumStatistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('module can be imported', async () => {
    const mod = await import('../forum-statistics');
    expect(mod).toBeTruthy();
  });
});
