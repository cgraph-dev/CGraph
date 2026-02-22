import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => {
  return new Proxy({}, {
    get: (_target, prop) => {
      if (prop === '__esModule') return true;
      if (typeof prop === 'string' && prop !== 'default') {
        return (props: any) => <span data-testid={`icon-${prop}`} {...props} />;
      }
      return undefined;
    },
  });
});

vi.mock('@/modules/forums/store', () => ({
  useForumStore: vi.fn(() => ({
    votePoll: vi.fn(),
    closePoll: vi.fn(),
  })),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => ({ user: { id: 'user-1' } })),
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('PollWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('module can be imported', async () => {
    const mod = await import('../poll-widget');
    expect(mod).toBeTruthy();
  }, 15000);
});
