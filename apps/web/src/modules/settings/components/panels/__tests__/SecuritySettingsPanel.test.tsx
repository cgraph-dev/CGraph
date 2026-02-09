import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => (props: any) => {
        const { children, ...rest } = props;
        const El = tag as any;
        return <El {...rest}>{children}</El>;
      },
    }
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const { mockUser } = vi.hoisted(() => ({
  mockUser: {
    id: 'user-1',
    username: 'testuser',
    twoFactorEnabled: false,
    emailVerifiedAt: null as string | null,
  },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => ({ user: mockUser })),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, ...rest }: any) => (
    <div data-testid="glass-card" {...rest}>
      {children}
    </div>
  ),
}));

import { SecuritySettingsPanel } from '../SecuritySettingsPanel';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SecuritySettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.twoFactorEnabled = false;
    mockUser.emailVerifiedAt = null;
  });

  it('renders Security heading', () => {
    render(<SecuritySettingsPanel />);
    const heading = screen.getByText('Security');
    expect(heading.tagName).toBe('H1');
  });

  it('renders Password section with Change button', () => {
    render(<SecuritySettingsPanel />);
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Change your password')).toBeInTheDocument();
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('renders 2FA section with Enable when disabled', () => {
    mockUser.twoFactorEnabled = false;
    render(<SecuritySettingsPanel />);
    expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByText('Add an extra layer of security')).toBeInTheDocument();
    expect(screen.getByText('Enable')).toBeInTheDocument();
  });

  it('renders 2FA section with Disable when enabled', () => {
    mockUser.twoFactorEnabled = true;
    render(<SecuritySettingsPanel />);
    expect(screen.getByText('Two-factor authentication is enabled')).toBeInTheDocument();
    expect(screen.getByText('Disable')).toBeInTheDocument();
  });

  it('renders email unverified state with Verify button', () => {
    mockUser.emailVerifiedAt = null;
    render(<SecuritySettingsPanel />);
    expect(screen.getByText('Email Verification')).toBeInTheDocument();
    expect(screen.getByText('Verify your email address')).toBeInTheDocument();
    expect(screen.getByText('Verify')).toBeInTheDocument();
  });

  it('renders email verified state with checkmark', () => {
    mockUser.emailVerifiedAt = '2025-06-01T00:00:00Z';
    render(<SecuritySettingsPanel />);
    expect(screen.getByText('Your email is verified')).toBeInTheDocument();
    expect(screen.getByText('✓ Verified')).toBeInTheDocument();
    expect(screen.queryByText('Verify')).not.toBeInTheDocument();
  });

  it('renders Active Sessions section with View Sessions link', () => {
    render(<SecuritySettingsPanel />);
    expect(screen.getByText('Active Sessions')).toBeInTheDocument();
    expect(screen.getByText('Manage your logged-in devices and sessions')).toBeInTheDocument();
    const link = screen.getByText('View Sessions');
    expect(link.getAttribute('href')).toBe('/settings/sessions');
  });

  it('renders multiple GlassCard containers', () => {
    render(<SecuritySettingsPanel />);
    const cards = screen.getAllByTestId('glass-card');
    expect(cards.length).toBe(4);
  });

  it('shows correct 2FA button styling when enabled vs disabled', () => {
    mockUser.twoFactorEnabled = true;
    const { rerender } = render(<SecuritySettingsPanel />);
    const disableBtn = screen.getByText('Disable');
    expect(disableBtn.className).toContain('bg-red');

    mockUser.twoFactorEnabled = false;
    rerender(<SecuritySettingsPanel />);
    const enableBtn = screen.getByText('Enable');
    expect(enableBtn.className).toContain('bg-green');
  });
});
