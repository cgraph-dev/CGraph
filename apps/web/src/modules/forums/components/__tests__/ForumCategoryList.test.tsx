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

vi.mock('@/lib/animation-presets/presets', () => ({
  staggerConfigs: { standard: { staggerChildren: 0.05 } },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  FolderIcon: () => <span data-testid="folder-icon" />,
  DocumentTextIcon: () => <span data-testid="doc-icon" />,
  ChevronRightIcon: () => <span data-testid="chevron-right" />,
  ChevronDownIcon: () => <span data-testid="chevron-down" />,
  PlusIcon: () => <span data-testid="plus-icon" />,
  Cog6ToothIcon: () => <span data-testid="cog-icon" />,
  EyeIcon: () => <span data-testid="eye-icon" />,
}));

// Dynamic import since ForumCategoryList may have complex lifecycle
describe('ForumCategoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('module can be imported', async () => {
    const mod = await import('../ForumCategoryList');
    expect(mod).toBeTruthy();
  });
});
