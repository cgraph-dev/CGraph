/** @module sync-status-indicator tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string} data-testid="motion-div">
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ArrowPathIcon: (props: Record<string, unknown>) => (
    <svg data-testid="arrow-path-icon" {...props} />
  ),
  CheckCircleIcon: (props: Record<string, unknown>) => (
    <svg data-testid="check-circle-icon" {...props} />
  ),
  XCircleIcon: (props: Record<string, unknown>) => <svg data-testid="x-circle-icon" {...props} />,
}));

import SyncStatusIndicator from '../sync-status-indicator';

describe('SyncStatusIndicator', () => {
  it('renders nothing when status is idle', () => {
    const { container } = render(<SyncStatusIndicator status="idle" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders "Saving..." text when status is saving', () => {
    render(<SyncStatusIndicator status="saving" />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('renders spinner icon when saving', () => {
    render(<SyncStatusIndicator status="saving" />);
    expect(screen.getByTestId('arrow-path-icon')).toBeInTheDocument();
  });

  it('renders "Saved" text when status is saved', () => {
    render(<SyncStatusIndicator status="saved" />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('renders check icon when saved', () => {
    render(<SyncStatusIndicator status="saved" />);
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
  });

  it('renders default error message when status is error', () => {
    render(<SyncStatusIndicator status="error" />);
    expect(screen.getByText('Failed to save')).toBeInTheDocument();
  });

  it('renders custom error message', () => {
    render(<SyncStatusIndicator status="error" errorMessage="Network error" />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders error icon when status is error', () => {
    render(<SyncStatusIndicator status="error" />);
    expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<SyncStatusIndicator status="saving" className="custom-class" />);
    const wrapper = screen.getByTestId('motion-div');
    expect(wrapper.className).toContain('custom-class');
  });

  it('does not render check icon when saving', () => {
    render(<SyncStatusIndicator status="saving" />);
    expect(screen.queryByTestId('check-circle-icon')).not.toBeInTheDocument();
  });
});
