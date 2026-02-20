import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
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

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('@/modules/forums/store', () => ({
  useAnnouncementStore: vi.fn(() => ({
    announcements: [],
    fetchAnnouncements: vi.fn(),
  })),
}));

vi.mock('@/modules/forums/components/AnnouncementItem', () => ({
  AnnouncementItem: ({ announcement }: any) => (
    <div data-testid="announcement-item">{announcement?.title}</div>
  ),
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
