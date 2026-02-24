/** @module profile-name-section tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileNameSection } from '../profile-name-section';
import type { UserProfileData } from '@/types/profile.types';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {} as Record<
      string,
      (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
    >,
    {
      get:
        (_target, prop) =>
        ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => {
          const Tag = (
            typeof prop === 'string' ? prop : 'div'
          ) as // eslint-disable-next-line @typescript-eslint/no-explicit-any
          any;
          return <Tag className={className as string}>{children}</Tag>;
        },
    }
  ),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ShieldCheckIcon: () => <span data-testid="premium-icon" />,
  CheckBadgeIcon: () => <span data-testid="verified-icon" />,
}));

vi.mock('@/modules/gamification/components/title-badge', () => ({
  TitleBadge: ({ title }: { title: string }) => <span data-testid="title-badge">{title}</span>,
}));

vi.mock('@/lib/animation-presets', () => ({
  springs: { bouncy: {} },
}));

function makeProfile(overrides: Partial<UserProfileData> = {}): UserProfileData {
  return {
    id: 'u1',
    username: 'alice',
    displayName: 'Alice Smith',
    avatarUrl: null,
    bannerUrl: null,
    bio: null,
    status: 'online',
    statusMessage: null,
    isVerified: false,
    isPremium: false,
    karma: 100,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ProfileNameSection', () => {
  it('renders display name when available', () => {
    render(<ProfileNameSection profile={makeProfile()} />);
    expect(screen.getByText('Alice Smith')).toBeTruthy();
  });

  it('falls back to username when displayName is null', () => {
    render(<ProfileNameSection profile={makeProfile({ displayName: null })} />);
    expect(screen.getByText('alice')).toBeTruthy();
  });

  it('shows @username', () => {
    render(<ProfileNameSection profile={makeProfile()} />);
    expect(screen.getByText('@alice')).toBeTruthy();
  });

  it('shows verified badge when isVerified', () => {
    render(<ProfileNameSection profile={makeProfile({ isVerified: true })} />);
    expect(screen.getByTestId('verified-icon')).toBeTruthy();
  });

  it('shows premium badge when isPremium', () => {
    render(<ProfileNameSection profile={makeProfile({ isPremium: true })} />);
    expect(screen.getByTestId('premium-icon')).toBeTruthy();
  });

  it('does not show badges when not verified or premium', () => {
    render(<ProfileNameSection profile={makeProfile()} />);
    expect(screen.queryByTestId('verified-icon')).toBeNull();
    expect(screen.queryByTestId('premium-icon')).toBeNull();
  });

  it('shows title badge when equippedTitle is set', () => {
    render(<ProfileNameSection profile={makeProfile({ equippedTitle: 'Legend' })} />);
    expect(screen.getByTestId('title-badge')).toBeTruthy();
    expect(screen.getByText('Legend')).toBeTruthy();
  });

  it('shows status message when present', () => {
    render(<ProfileNameSection profile={makeProfile({ statusMessage: 'AFK' })} />);
    expect(screen.getByText('AFK')).toBeTruthy();
  });

  it('hides status message when absent', () => {
    render(<ProfileNameSection profile={makeProfile()} />);
    // No extra text beyond name/username
    expect(screen.queryByText('AFK')).toBeNull();
  });
});
