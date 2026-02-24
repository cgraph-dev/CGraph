/**
 * @file group-list.test.tsx
 * @description Tests for GroupList component — group listing with search,
 *   grid/list view toggle, and create group modal.
 * @module groups/components/__tests__/GroupList
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────
vi.mock('framer-motion', () => {
  const motionProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'string') {
        return ({ children, initial, animate, exit, transition, variants, whileHover, whileTap, whileInView, layout, layoutId, ...rest }: any) => {
          const Tag = prop as any;
          return <Tag {...rest}>{children}</Tag>;
        };
      }
      return undefined;
    },
  });
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useAnimation: () => ({ start: vi.fn() }),
    useInView: () => true,
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    useTransform: () => ({ get: () => 0 }),
    useSpring: () => ({ get: () => 0 }),
  };
});

vi.mock('@/lib/animation-presets', () => ({ tweens: { standard: {} }, springs: { snappy: {}, bouncy: {} }, loop: () => ({}), loopWithDelay: () => ({}) }));
vi.mock('@/stores/theme', () => ({ useThemeStore: () => ({ theme: { colorPreset: 'blue' } }), THEME_COLORS: { blue: { primary: '#3b82f6', accent: '#8b5cf6' } } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

vi.mock('lucide-react', () => ({
  Plus: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="plus-icon" {...p} />,
  Search: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="search-icon" {...p} />,
  LayoutGrid: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="grid-icon" {...p} />,
  List: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="list-icon" {...p} />,
  Users: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="users-icon" {...p} />,
}));

const mockGroups = [
  { id: 'g-1', name: 'Alpha Group', description: 'First group', isPublic: true, memberCount: 10, onlineMemberCount: 3, iconUrl: null },
  { id: 'g-2', name: 'Beta Group', description: 'Second group', isPublic: false, memberCount: 20, onlineMemberCount: 0, iconUrl: null },
];

vi.mock('../../hooks/useGroups', () => ({
  useGroups: () => ({ groups: mockGroups, isLoading: false, create: vi.fn() }),
}));

vi.mock('./group-icon', () => ({ GroupIcon: () => <div data-testid="group-icon" /> }));
vi.mock('./group-card', () => ({
  GroupCard: ({ group, onClick }: { group: { name: string }; onClick: () => void }) => (
    <div data-testid="group-card" onClick={onClick}>{group.name}</div>
  ),
}));
vi.mock('./group-list-item', () => ({
  GroupListItem: ({ group, onClick }: { group: { name: string }; onClick: () => void }) => (
    <div data-testid="group-list-item" onClick={onClick}>{group.name}</div>
  ),
}));
vi.mock('./create-group-modal', () => ({
  CreateGroupModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="create-modal">Create Modal</div> : null,
}));

import { GroupList } from '../group-list/group-list';

// ── Tests ──────────────────────────────────────────────────────────────
describe('GroupList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders group cards in grid view by default', () => {
    render(<GroupList />);
    const cards = screen.getAllByTestId('group-card');
    expect(cards).toHaveLength(2);
  });

  it('renders search input when showSearch is true', () => {
    render(<GroupList showSearch />);
    expect(screen.getByPlaceholderText('Search groups...')).toBeInTheDocument();
  });

  it('hides search input when showSearch is false', () => {
    render(<GroupList showSearch={false} showCreateButton={false} />);
    expect(screen.queryByPlaceholderText('Search groups...')).not.toBeInTheDocument();
  });

  it('filters groups by search query', () => {
    render(<GroupList />);
    const input = screen.getByPlaceholderText('Search groups...');
    fireEvent.change(input, { target: { value: 'Alpha' } });
    expect(screen.getByText('Alpha Group')).toBeInTheDocument();
    expect(screen.queryByText('Beta Group')).not.toBeInTheDocument();
  });

  it('renders create group button when showCreateButton is true', () => {
    render(<GroupList />);
    expect(screen.getByText('Create Group')).toBeInTheDocument();
  });

  it('navigates to group on card click', () => {
    render(<GroupList />);
    fireEvent.click(screen.getByText('Alpha Group'));
    expect(mockNavigate).toHaveBeenCalledWith('/groups/g-1');
  });

  it('renders grid/list toggle buttons', () => {
    render(<GroupList />);
    expect(screen.getByTitle('Grid view')).toBeInTheDocument();
    expect(screen.getByTitle('List view')).toBeInTheDocument();
  });

  it('renders empty state when no groups match search', () => {
    render(<GroupList />);
    const input = screen.getByPlaceholderText('Search groups...');
    fireEvent.change(input, { target: { value: 'zzzzz' } });
    expect(screen.getByText('No groups found')).toBeInTheDocument();
  });
});
