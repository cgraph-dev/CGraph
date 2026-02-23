/** @module video-call-top-bar tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoCallTopBar } from '../video-call-top-bar';

vi.mock('@heroicons/react/24/outline', () => ({
  ArrowsPointingOutIcon: () => <span data-testid="fullscreen-icon" />,
  XMarkIcon: () => <span data-testid="close-icon" />,
}));

const defaultProps = {
  otherParticipantName: 'Alice',
  statusLabel: 'Connected',
  isFullscreen: false,
  onToggleFullscreen: vi.fn(),
  onClose: vi.fn(),
};

describe('VideoCallTopBar', () => {
  it('renders participant name', () => {
    render(<VideoCallTopBar {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('renders status label', () => {
    render(<VideoCallTopBar {...defaultProps} />);
    expect(screen.getByText('Connected')).toBeTruthy();
  });

  it('shows initial when no avatar provided', () => {
    render(<VideoCallTopBar {...defaultProps} />);
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('shows avatar image when provided', () => {
    render(<VideoCallTopBar {...defaultProps} otherParticipantAvatar="/avatar.png" />);
    const img = screen.getByAltText('Alice') as HTMLImageElement;
    expect(img.src).toContain('/avatar.png');
  });

  it('calls onToggleFullscreen when button clicked', () => {
    const onToggleFullscreen = vi.fn();
    render(<VideoCallTopBar {...defaultProps} onToggleFullscreen={onToggleFullscreen} />);
    fireEvent.click(screen.getByTitle('Fullscreen'));
    expect(onToggleFullscreen).toHaveBeenCalled();
  });

  it('shows Exit fullscreen title when fullscreen', () => {
    render(<VideoCallTopBar {...defaultProps} isFullscreen={true} />);
    expect(screen.getByTitle('Exit fullscreen')).toBeTruthy();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<VideoCallTopBar {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTitle('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
