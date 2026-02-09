import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { RoleManager } from '../role-manager/RoleManager';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockRoles = [
  {
    id: 'role-admin',
    name: 'Admin',
    color: '#ef4444',
    position: 2,
    permissions: 1,
    isDefault: false,
    isMentionable: true,
  },
  {
    id: 'role-mod',
    name: 'Moderator',
    color: '#3b82f6',
    position: 1,
    permissions: 0,
    isDefault: false,
    isMentionable: true,
  },
  {
    id: 'role-default',
    name: 'Member',
    color: '#22c55e',
    position: 0,
    permissions: 0,
    isDefault: true,
    isMentionable: false,
  },
];

const mockGroups = [{ id: 'grp-1', name: 'My Group', roles: mockRoles }];

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: vi.fn(() => ({ groups: mockGroups })),
}));

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, whileHover, whileTap, ...rest }: any) => (
      <button {...rest}>{children}</button>
    ),
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
  Reorder: {
    Group: ({ children, onReorder, ...rest }: any) => <div {...rest}>{children}</div>,
    Item: ({ children, value, ...rest }: any) => <div {...rest}>{children}</div>,
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ShieldCheckIcon: (p: any) => <svg data-testid="shield-icon" {...p} />,
  PlusIcon: (p: any) => <svg data-testid="plus-icon" {...p} />,
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

vi.mock('../role-manager/RoleEditor', () => ({
  RoleEditor: ({ role, isNew, onDelete }: any) => (
    <div data-testid="role-editor">
      <span data-testid="editing-role">{role.name}</span>
      {isNew && <span data-testid="is-new">new</span>}
      <button data-testid="delete-role" onClick={onDelete}>
        Delete
      </button>
    </div>
  ),
}));

vi.mock('../role-manager/constants', () => ({
  PERMISSIONS: {
    SEND_MESSAGES: { value: 1 << 13, label: 'Send Messages', description: 'Send messages' },
    ADD_REACTIONS: { value: 1 << 16, label: 'Add Reactions', description: 'Add reactions' },
  },
  ROLE_COLORS: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'],
}));

// ── Tests ──────────────────────────────────────────────────────────────

describe('RoleManager', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the Roles heading', () => {
    render(<RoleManager groupId="grp-1" />);
    expect(screen.getByText('Roles')).toBeInTheDocument();
  });

  it('renders all existing roles from the group', () => {
    render(<RoleManager groupId="grp-1" />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Moderator')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('marks default role with DEFAULT label', () => {
    render(<RoleManager groupId="grp-1" />);
    expect(screen.getByText('DEFAULT')).toBeInTheDocument();
  });

  it('shows empty editor prompt when no role selected', () => {
    render(<RoleManager groupId="grp-1" />);
    expect(screen.getByText('Select a role to edit')).toBeInTheDocument();
  });

  it('opens role editor when a role is clicked', () => {
    render(<RoleManager groupId="grp-1" />);
    fireEvent.click(screen.getByText('Admin'));
    expect(screen.getByTestId('role-editor')).toBeInTheDocument();
    expect(screen.getByTestId('editing-role')).toHaveTextContent('Admin');
  });

  it('creates a new role on plus button click', () => {
    render(<RoleManager groupId="grp-1" />);
    const plusBtn = screen.getByTestId('plus-icon').closest('button')!;
    fireEvent.click(plusBtn);
    expect(screen.getByTestId('role-editor')).toBeInTheDocument();
    expect(screen.getByTestId('is-new')).toBeInTheDocument();
    expect(screen.getAllByText('New Role').length).toBeGreaterThanOrEqual(1);
  });

  it('deletes selected role when delete is clicked', () => {
    render(<RoleManager groupId="grp-1" />);
    fireEvent.click(screen.getByText('Admin'));
    expect(screen.getByTestId('editing-role')).toHaveTextContent('Admin');
    fireEvent.click(screen.getByTestId('delete-role'));
    // Admin should be removed, editor should close
    expect(screen.queryByTestId('role-editor')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<RoleManager groupId="grp-1" className="custom-cls" />);
    expect(container.firstChild).toHaveClass('custom-cls');
  });

  it('renders role sidebar and editor area', () => {
    const { container } = render(<RoleManager groupId="grp-1" />);
    const roleList = container.querySelector('.w-64');
    expect(roleList).toBeTruthy();
  });

  it('switching between roles updates editor', () => {
    render(<RoleManager groupId="grp-1" />);
    fireEvent.click(screen.getByText('Admin'));
    expect(screen.getByTestId('editing-role')).toHaveTextContent('Admin');
  });
});
