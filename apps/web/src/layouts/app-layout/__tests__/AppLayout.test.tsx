// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── vi.hoisted ─────────────────────────────────────────────────────────

const { mockUseAppLayout } = vi.hoisted(() => ({
  mockUseAppLayout: vi.fn(),
}));

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn(() => ({ theme: 'dark', accentColor: 'blue' })),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/' })),
  useParams: vi.fn(() => ({})),
  Link: ({ children, to, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  NavLink: ({
    children,
    to,
    'aria-label': ariaLabel,
    'aria-current': ariaCurrent,
    title,
    className,
    onClick,
    ...rest
  }: any) => (
    <a
      href={to}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      title={title}
      className={typeof className === 'function' ? '' : className}
    >
      {typeof children === 'function' ? children({ isActive: false }) : children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet" />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
    button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
    span: ({ children, ...rest }: any) => <span {...rest}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
  ToastContainer: () => <div data-testid="toast-container" />,
}));

vi.mock('@/components/shaders/ShaderBackground', () => ({
  default: () => <div data-testid="shader-background" />,
}));

vi.mock('@/components/AnimatedLogo', () => ({
  default: () => <div data-testid="animated-logo" />,
}));

vi.mock('@/components/theme/ThemedAvatar', () => ({
  ThemedAvatar: ({ alt }: any) => <div data-testid="themed-avatar">{alt}</div>,
}));

vi.mock('@/lib/utils', () => ({
  getAvatarBorderId: vi.fn(() => 'default'),
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

vi.mock('@/lib/animations/transitions', () => ({
  pageTransitions: {},
  buttonVariantsSubtle: {},
}));

vi.mock('../hooks', () => ({
  useAppLayout: mockUseAppLayout,
}));

vi.mock('../constants', () => ({
  navItems: [
    {
      path: '/messages',
      label: 'Messages',
      icon: () => <span data-testid="icon-messages">M</span>,
      activeIcon: () => <span data-testid="icon-messages-active">M</span>,
    },
    {
      path: '/social',
      label: 'Social',
      icon: () => <span data-testid="icon-social">S</span>,
      activeIcon: () => <span data-testid="icon-social-active">S</span>,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: () => <span data-testid="icon-settings">G</span>,
      activeIcon: () => <span data-testid="icon-settings-active">G</span>,
    },
  ],
}));

import AppLayout from '../AppLayout';
import Sidebar from '../Sidebar';

// ── Fixtures ───────────────────────────────────────────────────────────

const mockUser = {
  id: 'u1',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: null,
};

const baseLayout = {
  location: { pathname: '/messages' },
  user: mockUser,
  theme: { colors: { background: '#121212', primary: '#10b981' } },
  backgroundSettings: { effect: 'none', variant: 'matrix', intensity: 0.6 },
  shaderColors: { color1: '#00ff88', color2: '#121212', color3: '#00ccff' },
  handleLogout: vi.fn(),
  totalUnread: 0,
  unreadCount: 0,
};

// ── Tests ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAppLayout.mockReturnValue({ ...baseLayout });
});

describe('AppLayout', () => {
  it('renders main layout with outlet and toast container', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  it('renders skip-to-content link for accessibility', () => {
    render(<AppLayout />);
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('renders main element with role main', () => {
    render(<AppLayout />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders shader background when effect is shader', () => {
    mockUseAppLayout.mockReturnValue({
      ...baseLayout,
      backgroundSettings: { effect: 'shader', variant: 'matrix', intensity: 0.6 },
    });
    render(<AppLayout />);
    expect(screen.getByTestId('shader-background')).toBeInTheDocument();
  });

  it('does not render shader background when effect is none', () => {
    render(<AppLayout />);
    expect(screen.queryByTestId('shader-background')).not.toBeInTheDocument();
  });
});

describe('Sidebar', () => {
  const sidebarProps = {
    user: mockUser,
    location: { pathname: '/messages' } as any,
    handleLogout: vi.fn(),
    totalUnread: 0,
    unreadCount: 0,
    navItems: [
      {
        path: '/messages',
        label: 'Messages',
        icon: () => <span>M</span>,
        activeIcon: () => <span>M*</span>,
      },
      {
        path: '/social',
        label: 'Social',
        icon: () => <span>S</span>,
        activeIcon: () => <span>S*</span>,
      },
    ],
  };

  it('renders navigation with aria label', () => {
    render(<Sidebar {...sidebarProps} />);
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders animated logo with link to home', () => {
    render(<Sidebar {...sidebarProps} />);
    expect(screen.getByTestId('animated-logo')).toBeInTheDocument();
  });

  it('renders nav items with proper aria labels', () => {
    render(<Sidebar {...sidebarProps} />);
    expect(screen.getByLabelText('Messages')).toBeInTheDocument();
    expect(screen.getByLabelText('Social')).toBeInTheDocument();
  });

  it('shows unread badge on messages when totalUnread > 0', () => {
    render(<Sidebar {...sidebarProps} totalUnread={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('caps unread badge at 99+', () => {
    render(<Sidebar {...sidebarProps} totalUnread={150} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('shows unread badge on social when unreadCount > 0', () => {
    render(<Sidebar {...sidebarProps} unreadCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('caps social badge at 99+', () => {
    render(<Sidebar {...sidebarProps} unreadCount={200} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});
