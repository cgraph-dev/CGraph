/** @module invites-tab tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvitesTab } from '../invites-tab';

vi.mock('framer-motion', () => {
  const cache = new Map<
    string | symbol,
    (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
  >();
  return {
    motion: new Proxy(
      {} as Record<
        string,
        (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
      >,
      {
        get: (_target, prop) => {
          if (!cache.has(prop)) {
            const Tag = (
              typeof prop === 'string' ? prop : 'div'
            ) as // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any;
            cache.set(prop, function MotionMock({ children, className, onClick }) {
              return (
                <Tag className={className as string} onClick={onClick as React.MouseEventHandler}>
                  {children}
                </Tag>
              );
            });
          }
          return cache.get(prop);
        },
      }
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('../../invite-modal', () => ({
  InviteModal: ({ groupName, onClose }: { groupName: string; onClose: () => void }) => (
    <div data-testid="invite-modal">
      <span>{groupName}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('InvitesTab', () => {
  it('renders header', () => {
    render(<InvitesTab groupId="g1" groupName="Dev Team" />);
    expect(screen.getByText('Invites')).toBeTruthy();
    expect(screen.getByText('Manage invitation links for your group.')).toBeTruthy();
  });

  it('renders Create Invite button', () => {
    render(<InvitesTab groupId="g1" groupName="Dev Team" />);
    expect(screen.getByText('Create Invite')).toBeTruthy();
  });

  it('hides InviteModal by default', () => {
    render(<InvitesTab groupId="g1" groupName="Dev Team" />);
    expect(screen.queryByTestId('invite-modal')).toBeNull();
  });

  it('shows InviteModal when Create Invite clicked', () => {
    render(<InvitesTab groupId="g1" groupName="Dev Team" />);
    fireEvent.click(screen.getByText('Create Invite'));
    expect(screen.getByTestId('invite-modal')).toBeTruthy();
    expect(screen.getByText('Dev Team')).toBeTruthy();
  });

  it('closes InviteModal when onClose called', () => {
    render(<InvitesTab groupId="g1" groupName="Dev Team" />);
    fireEvent.click(screen.getByText('Create Invite'));
    expect(screen.getByTestId('invite-modal')).toBeTruthy();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('invite-modal')).toBeNull();
  });
});
