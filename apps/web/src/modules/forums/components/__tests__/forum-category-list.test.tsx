/** @module ForumCategoryList tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const cache = new Map<string | symbol, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>();
  return {
    motion: new Proxy({} as Record<string, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>, {
      get: (_target, prop) => {
        if (!cache.has(prop)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Tag = (typeof prop === 'string' ? prop : 'div') as any;
          cache.set(prop, function MotionMock({ children, className, onClick }) {
            return <Tag className={className as string} onClick={onClick as React.MouseEventHandler}>{children}</Tag>;
          });
        }
        return cache.get(prop);
      },
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {}, fast: {} },
  springs: { snappy: {}, bouncy: {} },
  loop: () => ({}),
  staggerConfigs: { standard: { staggerChildren: 0.05 }, fast: {} },
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>{children}</a>
  ),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  FolderIcon: ({ className }: { className?: string }) => <span data-testid="folder-icon" className={className} />,
  DocumentTextIcon: ({ className }: { className?: string }) => <span data-testid="doc-icon" className={className} />,
  ChevronRightIcon: ({ className }: { className?: string }) => <span data-testid="chevron-icon" className={className} />,
  ChevronDownIcon: ({ className }: { className?: string }) => <span data-testid="chevron-down-icon" className={className} />,
  PlusIcon: ({ className }: { className?: string }) => <span data-testid="plus-icon" className={className} />,
  Cog6ToothIcon: ({ className }: { className?: string }) => <span data-testid="cog-icon" className={className} />,
  EyeIcon: ({ className }: { className?: string }) => <span data-testid="eye-icon" className={className} />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
}));

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/modules/forums/components/forum-category-list/index', () => ({
  useForumCategoryList: (categories: { id: string }[], forums: unknown[]) => ({
    expandedCategories: new Set(categories.map((c) => c.id)),
    forumsByCategory: {},
    toggleCategory: vi.fn(),
  }),
  ForumRow: () => <div data-testid="forum-row" />,
  ForumCategoryCard: () => <div data-testid="forum-category-card" />,
  ForumCategoryEmptyState: () => <div data-testid="empty-state">No categories yet</div>,
}));

import { ForumCategoryList } from '../forum-category-list';

function makeCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    name: 'General Discussion',
    slug: 'general',
    description: 'Talk about anything',
    color: '#10B981',
    order: 1,
    postCount: 42,
    ...overrides,
  };
}

describe('ForumCategoryList', () => {
  let onCategoryClick: ReturnType<typeof vi.fn>;
  let onForumClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCategoryClick = vi.fn();
    onForumClick = vi.fn();
  });

  it('renders category names', () => {
    const categories = [makeCategory()];
    render(<ForumCategoryList categories={categories} onCategoryClick={onCategoryClick} />);
    expect(screen.getByText('General Discussion')).toBeInTheDocument();
  });

  it('renders category description', () => {
    const categories = [makeCategory()];
    render(<ForumCategoryList categories={categories} />);
    expect(screen.getByText('Talk about anything')).toBeInTheDocument();
  });

  it('renders post count', () => {
    const categories = [makeCategory({ postCount: 1234 })];
    render(<ForumCategoryList categories={categories} />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders multiple categories', () => {
    const categories = [
      makeCategory({ id: 'cat-1', name: 'General' }),
      makeCategory({ id: 'cat-2', name: 'Tech Talk' }),
    ];
    render(<ForumCategoryList categories={categories} />);
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Tech Talk')).toBeInTheDocument();
  });

  it('renders folder icons for categories', () => {
    const categories = [makeCategory()];
    render(<ForumCategoryList categories={categories} />);
    expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
  });

  it('renders chevron icons for expand/collapse', () => {
    const categories = [makeCategory()];
    render(<ForumCategoryList categories={categories} />);
    expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
  });

  it('does not show admin controls when canManage is false', () => {
    const categories = [makeCategory()];
    render(<ForumCategoryList categories={categories} canManage={false} />);
    expect(screen.queryByTestId('cog-icon')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ForumCategoryList categories={[makeCategory()]} className="custom-class" />
    );
    expect(container.innerHTML).toContain('custom-class');
  });
});
