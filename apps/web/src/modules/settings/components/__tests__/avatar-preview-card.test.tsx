/**
 * @file Tests for AvatarPreviewCard component (avatar-settings)
 * @module settings/components/avatar-settings/avatar-preview-card
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: ({ className }: { className?: string }) => (
    <span data-testid="sparkles-icon" className={className} />
  ),
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
  AnimatedAvatar: ({
    src,
    alt,
    size,
    showStatus,
    statusType,
  }: {
    src?: string | null;
    alt: string;
    size?: string;
    showStatus?: boolean;
    statusType?: string;
  }) => (
    <div
      data-testid="animated-avatar"
      data-src={src ?? ''}
      data-alt={alt}
      data-size={size}
      data-show-status={showStatus}
      data-status-type={statusType}
    />
  ),
}));

import { AvatarPreviewCard } from '../avatar-settings/avatar-preview-card';

describe('AvatarPreviewCard', () => {
  it('renders "Live Preview" heading', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
  });

  it('renders sparkles icon', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('renders GlassCard with frosted variant', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('glass-card')).toHaveAttribute('data-variant', 'frosted');
  });

  it('renders AnimatedAvatar', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('animated-avatar')).toBeInTheDocument();
  });

  it('passes avatarUrl to AnimatedAvatar', () => {
    render(<AvatarPreviewCard avatarUrl="https://example.com/avatar.jpg" />);
    expect(screen.getByTestId('animated-avatar')).toHaveAttribute(
      'data-src',
      'https://example.com/avatar.jpg'
    );
  });

  it('passes displayName as alt text', () => {
    render(<AvatarPreviewCard displayName="Alice" />);
    expect(screen.getByTestId('animated-avatar')).toHaveAttribute('data-alt', 'Alice');
  });

  it('uses "User" as default alt text', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('animated-avatar')).toHaveAttribute('data-alt', 'User');
  });

  it('renders description text', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByText('Your avatar with current settings')).toBeInTheDocument();
  });

  it('passes xl size to avatar', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('animated-avatar')).toHaveAttribute('data-size', 'xl');
  });

  it('shows online status on avatar', () => {
    render(<AvatarPreviewCard />);
    expect(screen.getByTestId('animated-avatar')).toHaveAttribute('data-status-type', 'online');
  });
});
