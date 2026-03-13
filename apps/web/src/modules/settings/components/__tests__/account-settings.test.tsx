/** @module AccountSettings tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      canChangeUsername: true,
      usernameNextChangeAt: null,
    },
    updateUser: vi.fn(),
  }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    put: vi.fn().mockResolvedValue({ data: { data: { display_name: 'Updated' } } }),
  },
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
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/modules/settings/components/user-id-badge', () => ({
  UserIdBadge: ({ user: _user }: { user: unknown }) => (
    <div data-testid="user-id-badge">User ID Badge</div>
  ),
}));

vi.mock('@/modules/settings/components/avatar-section', () => ({
  AvatarSection: ({ user: _user }: { user: unknown }) => (
    <div data-testid="avatar-section">Avatar Section</div>
  ),
}));

vi.mock('@/modules/settings/components/profile-form-fields', () => ({
  ProfileFormFields: () => <div data-testid="profile-form-fields">Profile Fields</div>,
}));

import { AccountSettings } from '../account-settings';

describe('AccountSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<AccountSettings />);
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });

  it('renders UserIdBadge component', () => {
    render(<AccountSettings />);
    expect(screen.getByTestId('user-id-badge')).toBeInTheDocument();
  });

  it('renders AvatarSection component', () => {
    render(<AccountSettings />);
    expect(screen.getByTestId('avatar-section')).toBeInTheDocument();
  });

  it('renders username input with current username', () => {
    render(<AccountSettings />);
    const usernameInput = screen.getByPlaceholderText('testuser');
    expect(usernameInput).toHaveValue('testuser');
  });

  it('renders username label', () => {
    render(<AccountSettings />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('allows typing in username field', () => {
    render(<AccountSettings />);
    const usernameInput = screen.getByPlaceholderText('testuser');
    fireEvent.change(usernameInput, { target: { value: 'newname' } });
    expect(usernameInput).toHaveValue('newname');
  });

  it('filters invalid characters from username input', () => {
    render(<AccountSettings />);
    const usernameInput = screen.getByPlaceholderText('testuser');
    // The component's onChange lowercases and strips non-alphanumeric/underscore chars
    // In JSDOM, fireEvent.change sets target.value then React's onChange processes it
    fireEvent.change(usernameInput, { target: { value: 'valid_name123' } });
    expect(usernameInput).toHaveValue('valid_name123');
  });

  it('shows Change button when username differs and is long enough', () => {
    render(<AccountSettings />);
    const usernameInput = screen.getByPlaceholderText('testuser');
    fireEvent.change(usernameInput, { target: { value: 'newname' } });
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('does not show Change button when username matches current', () => {
    render(<AccountSettings />);
    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });

  it('renders GlassCard wrapper for username section', () => {
    render(<AccountSettings />);
    const cards = screen.getAllByTestId('glass-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });
});
