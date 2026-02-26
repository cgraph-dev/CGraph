import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GroupCard } from '../group-list/group-card';
import type { Group } from '../group-list/types';

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, whileHover: _whileHover, whileTap: _whileTap, ...rest }: any) => <div {...rest}>{children}</div>,
  },
}));

vi.mock('@/shared/components/ui', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GlobeAltIcon: (p: any) => <svg data-testid="globe-icon" {...p} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LockClosedIcon: (p: any) => <svg data-testid="lock-icon" {...p} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UserGroupIcon: (p: any) => <svg data-testid="users-icon" {...p} />,
}));

// ── Helpers ────────────────────────────────────────────────────────────

const makeGroup = (overrides?: Partial<Group>): Group => ({
  id: 'grp-1',
  name: 'Test Group',
  slug: 'test-group',
  description: 'A test group description',
  iconUrl: null,
  bannerUrl: null,
  isPublic: true,
  memberCount: 42,
  onlineMemberCount: 5,
  ownerId: 'user-1',
  categories: [],
  channels: [],
  roles: [],
  myMember: null,
  createdAt: '2026-01-01',
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────────────────

describe('GroupCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders group name', () => {
    render(<GroupCard group={makeGroup()} onClick={vi.fn()} />);
    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<GroupCard group={makeGroup()} onClick={vi.fn()} />);
    expect(screen.getByText('A test group description')).toBeInTheDocument();
  });

  it('hides description when null', () => {
    render(<GroupCard group={makeGroup({ description: null })} onClick={vi.fn()} />);
    expect(screen.queryByText('A test group description')).not.toBeInTheDocument();
  });

  it('shows Public badge for public groups', () => {
    render(<GroupCard group={makeGroup({ isPublic: true })} onClick={vi.fn()} />);
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
  });

  it('shows Private badge for private groups', () => {
    render(<GroupCard group={makeGroup({ isPublic: false })} onClick={vi.fn()} />);
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('displays member count', () => {
    render(<GroupCard group={makeGroup({ memberCount: 128 })} onClick={vi.fn()} />);
    expect(screen.getByText('128 members')).toBeInTheDocument();
  });

  it('displays online member count when > 0', () => {
    render(<GroupCard group={makeGroup({ onlineMemberCount: 10 })} onClick={vi.fn()} />);
    expect(screen.getByText('10 online')).toBeInTheDocument();
  });

  it('hides online count when 0', () => {
    render(<GroupCard group={makeGroup({ onlineMemberCount: 0 })} onClick={vi.fn()} />);
    expect(screen.queryByText(/online/)).not.toBeInTheDocument();
  });

  it('shows banner image when bannerUrl is provided', () => {
    const { container } = render(
      <GroupCard group={makeGroup({ bannerUrl: '/banner.jpg' })} onClick={vi.fn()} />
    );
    const img = container.querySelector('img[src="/banner.jpg"]');
    expect(img).toBeTruthy();
  });

  it('shows icon image when iconUrl is provided', () => {
    render(
      <GroupCard
        group={makeGroup({ iconUrl: '/icon.png', name: 'Cool Group' })}
        onClick={vi.fn()}
      />
    );
    const img = screen.getByAltText('Cool Group');
    expect(img).toHaveAttribute('src', '/icon.png');
  });

  it('shows initials when no iconUrl', () => {
    render(<GroupCard group={makeGroup({ iconUrl: null, name: 'Alpha' })} onClick={vi.fn()} />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<GroupCard group={makeGroup()} onClick={onClick} />);
    fireEvent.click(screen.getByText('Test Group'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders within a GlassCard', () => {
    render(<GroupCard group={makeGroup()} onClick={vi.fn()} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });
});
