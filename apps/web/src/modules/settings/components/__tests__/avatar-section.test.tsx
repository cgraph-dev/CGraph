/** @module avatar-section tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button onClick={onClick as React.MouseEventHandler} {...rest}>
        {children}
      </button>
    ),
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <img data-testid="themed-avatar" alt={alt} />,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { medium: vi.fn() },
}));

vi.mock('@/lib/utils', () => ({
  getAvatarBorderId: vi.fn(() => 'border-1'),
}));

import { AvatarSection } from '../avatar-section';
import { HapticFeedback } from '@/lib/animations/animation-engine';

const mockHaptic = vi.mocked(HapticFeedback);

const mockUser = {
  id: 'user-1',
  displayName: 'Test User',
  username: 'testuser',
  avatarUrl: 'https://example.com/avatar.jpg',
};

describe('AvatarSection', () => {
  it('renders "Profile Picture" label', () => {
    render(<AvatarSection user={mockUser as never} />);
    expect(screen.getByText('Profile Picture')).toBeInTheDocument();
  });

  it('renders themed avatar when user has avatarUrl', () => {
    render(<AvatarSection user={mockUser as never} />);
    expect(screen.getByTestId('themed-avatar')).toBeInTheDocument();
  });

  it('renders initial fallback when no avatarUrl', () => {
    const noAvatar = { ...mockUser, avatarUrl: '' };
    render(<AvatarSection user={noAvatar as never} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders "Upload Image" button', () => {
    render(<AvatarSection user={mockUser as never} />);
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('renders file size hint', () => {
    render(<AvatarSection user={mockUser as never} />);
    expect(screen.getByText('JPG, PNG, or GIF. Max 2MB.')).toBeInTheDocument();
  });

  it('triggers haptic feedback on upload button click', () => {
    render(<AvatarSection user={mockUser as never} />);
    fireEvent.click(screen.getByText('Upload Image'));
    expect(mockHaptic.medium).toHaveBeenCalledOnce();
  });

  it('renders inside GlassCard', () => {
    render(<AvatarSection user={mockUser as never} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });

  it('renders fallback initial "U" for null user', () => {
    render(<AvatarSection user={null} />);
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('uses username for initial fallback if no displayName', () => {
    const userNoDisplayName = { ...mockUser, displayName: '', avatarUrl: '' };
    render(<AvatarSection user={userNoDisplayName as never} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
