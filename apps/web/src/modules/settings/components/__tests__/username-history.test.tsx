/** @module username-history tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/shared/components/ui', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  Loader2: (props: Record<string, unknown>) => <svg data-testid="loader" {...props} />,
  History: (props: Record<string, unknown>) => <svg data-testid="history-icon" {...props} />,
}));

import { UsernameHistorySection } from '../username-history';

const mockHistory = [
  {
    id: '1',
    oldUsername: 'oldname1',
    newUsername: 'newname1',
    changedAt: new Date('2024-01-15'),
    changedByAdmin: false,
  },
  {
    id: '2',
    oldUsername: 'oldname2',
    newUsername: 'newname2',
    changedAt: new Date('2024-03-20'),
    changedByAdmin: false,
  },
];

describe('UsernameHistorySection', () => {
  const defaultProps = {
    showHistory: false,
    onToggle: vi.fn(),
    history: mockHistory,
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Show username history" button when collapsed', () => {
    render(<UsernameHistorySection {...defaultProps} />);
    expect(screen.getByText(/Show.*username history/)).toBeInTheDocument();
  });

  it('renders "Hide username history" button when expanded', () => {
    render(<UsernameHistorySection {...defaultProps} showHistory />);
    expect(screen.getByText(/Hide.*username history/)).toBeInTheDocument();
  });

  it('calls onToggle when button is clicked', () => {
    render(<UsernameHistorySection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(defaultProps.onToggle).toHaveBeenCalledOnce();
  });

  it('does not show history list when collapsed', () => {
    render(<UsernameHistorySection {...defaultProps} />);
    expect(screen.queryByText('oldname1')).not.toBeInTheDocument();
  });

  it('shows history items when expanded', () => {
    render(<UsernameHistorySection {...defaultProps} showHistory />);
    expect(screen.getByText('oldname1')).toBeInTheDocument();
    expect(screen.getByText('newname1')).toBeInTheDocument();
    expect(screen.getByText('oldname2')).toBeInTheDocument();
    expect(screen.getByText('newname2')).toBeInTheDocument();
  });

  it('shows arrow between old and new username', () => {
    render(<UsernameHistorySection {...defaultProps} showHistory />);
    const arrows = screen.getAllByText('→');
    expect(arrows).toHaveLength(2);
  });

  it('shows loader when loading', () => {
    render(<UsernameHistorySection {...defaultProps} showHistory loading />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows empty state when no history', () => {
    render(<UsernameHistorySection {...defaultProps} showHistory history={[]} />);
    expect(screen.getByText('No username changes recorded')).toBeInTheDocument();
  });

  it('renders history icon', () => {
    render(<UsernameHistorySection {...defaultProps} />);
    expect(screen.getByTestId('history-icon')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<UsernameHistorySection {...defaultProps} showHistory />);
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('Mar 20, 2024')).toBeInTheDocument();
  });
});
