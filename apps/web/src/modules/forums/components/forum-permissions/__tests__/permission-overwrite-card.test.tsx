/** @module permission-overwrite-card tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
      <div className={className}>{children}</div>
    ),
    button: ({
      children,
      className,
      onClick,
    }: React.PropsWithChildren<{ className?: string; onClick?: () => void }>) => (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <span data-testid="x-icon" />,
  UserGroupIcon: () => <span data-testid="group-icon" />,
  CheckIcon: () => <span data-testid="check-icon" />,
  MinusIcon: () => <span data-testid="minus-icon" />,
  NoSymbolIcon: () => <span data-testid="deny-icon" />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

vi.mock('../perm-toggle', () => ({
  PermToggle: ({ value, onClick }: { value: string; onClick: () => void }) => (
    <button data-testid={`perm-${value}`} onClick={onClick}>
      {value}
    </button>
  ),
}));

import { PermissionOverwriteCard } from '../permission-overwrite-card';

describe('PermissionOverwriteCard', () => {
  const mockOverwrite = {
    group_id: 'g1',
    group_name: 'Moderators',
    applies_to: 'role',
    permissions: {
      can_post: 'allow' as const,
      can_edit: 'deny' as const,
      can_delete: 'inherit' as const,
    },
  };

  const mockPerms = [
    { key: 'can_post', label: 'Post', description: 'Can post', category: 'Content' },
    { key: 'can_edit', label: 'Edit', description: 'Can edit', category: 'Content' },
    { key: 'can_delete', label: 'Delete', description: 'Can delete', category: 'Moderation' },
  ] as const;

  const defaultProps = {
    overwrite: mockOverwrite,
    perms: mockPerms,
    categories: ['Content', 'Moderation'],
    onDelete: vi.fn(),
    onCyclePerm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the group name', () => {
    render(<PermissionOverwriteCard {...defaultProps} />);
    expect(screen.getByText('Moderators')).toBeInTheDocument();
  });

  it('shows the applies_to badge', () => {
    render(<PermissionOverwriteCard {...defaultProps} />);
    expect(screen.getByText('role')).toBeInTheDocument();
  });

  it('renders group icon', () => {
    render(<PermissionOverwriteCard {...defaultProps} />);
    expect(screen.getByTestId('group-icon')).toBeInTheDocument();
  });

  it('renders perm toggles for each permission', () => {
    render(<PermissionOverwriteCard {...defaultProps} />);
    expect(screen.getByTestId('perm-allow')).toBeInTheDocument();
    expect(screen.getByTestId('perm-deny')).toBeInTheDocument();
    expect(screen.getByTestId('perm-inherit')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<PermissionOverwriteCard {...defaultProps} />);
    const xBtn = screen.getByTestId('x-icon').closest('button');
    if (xBtn) fireEvent.click(xBtn);
    expect(defaultProps.onDelete).toHaveBeenCalledWith('g1');
  });
});
