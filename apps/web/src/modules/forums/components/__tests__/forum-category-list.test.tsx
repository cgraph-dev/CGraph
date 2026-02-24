import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock router
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/lib/animation-presets', () => ({
  staggerConfigs: { standard: { staggerChildren: 0.05 } },
  springs: { default: { type: 'spring', stiffness: 170, damping: 26 } },
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

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn(() => ({ theme: 'dark', accentColor: 'emerald' })),
  THEME_COLORS: { emerald: { primary: '#10b981' } },
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

vi.mock('@/modules/forums/components/forum-category-list', () => ({
  useForumCategoryList: vi.fn(() => ({
    expandedCategories: new Set(),
    toggleCategory: vi.fn(),
    sortedCategories: [],
  })),
  ForumRow: ({ forum }: any) => <div data-testid="forum-row">{forum?.name}</div>,
  ForumCategoryCard: ({ category }: any) => <div data-testid="category-card">{category?.name}</div>,
  ForumCategoryEmptyState: () => <div data-testid="empty-state">No forums</div>,
}));

describe('ForumCategoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('module can be imported', async () => {
    const mod = await import('../forum-category-list');
    expect(mod).toBeTruthy();
  }, 15000);
});
