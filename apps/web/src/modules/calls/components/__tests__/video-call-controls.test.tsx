/**
 * @file Tests for VideoCallControls component
 * @module calls/components/video-call-controls
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@heroicons/react/24/outline', () => ({
  PhoneXMarkIcon: ({ className }: { className?: string }) => (
    <span data-testid="phone-end-icon" className={className} />
  ),
  MicrophoneIcon: ({ className }: { className?: string }) => (
    <span data-testid="mic-icon" className={className} />
  ),
  VideoCameraIcon: ({ className }: { className?: string }) => (
    <span data-testid="video-icon" className={className} />
  ),
  ComputerDesktopIcon: ({ className }: { className?: string }) => (
    <span data-testid="screen-share-icon" className={className} />
  ),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  VideoCameraSlashIcon: ({ className }: { className?: string }) => (
    <span data-testid="video-off-icon" className={className} />
  ),
}));

import { VideoCallControls } from '../video-call-controls';

const defaultProps = {
  isMuted: false,
  isVideoEnabled: true,
  onToggleMute: vi.fn(),
  onEndCall: vi.fn(),
  onToggleVideo: vi.fn(),
};

describe('VideoCallControls', () => {
  it('renders mute button', () => {
    render(<VideoCallControls {...defaultProps} />);
    expect(screen.getByTitle('Mute')).toBeInTheDocument();
  });

  it('renders unmute title when muted', () => {
    render(<VideoCallControls {...defaultProps} isMuted={true} />);
    expect(screen.getByTitle('Unmute')).toBeInTheDocument();
  });

  it('renders end call button', () => {
    render(<VideoCallControls {...defaultProps} />);
    expect(screen.getByTitle('End call')).toBeInTheDocument();
  });

  it('renders video toggle button with camera on', () => {
    render(<VideoCallControls {...defaultProps} isVideoEnabled={true} />);
    expect(screen.getByTitle('Turn off camera')).toBeInTheDocument();
    expect(screen.getByTestId('video-icon')).toBeInTheDocument();
  });

  it('renders video toggle button with camera off', () => {
    render(<VideoCallControls {...defaultProps} isVideoEnabled={false} />);
    expect(screen.getByTitle('Turn on camera')).toBeInTheDocument();
    expect(screen.getByTestId('video-off-icon')).toBeInTheDocument();
  });

  it('calls onToggleMute when mute button clicked', async () => {
    const user = userEvent.setup();
    const onToggleMute = vi.fn();
    render(<VideoCallControls {...defaultProps} onToggleMute={onToggleMute} />);
    await user.click(screen.getByTitle('Mute'));
    expect(onToggleMute).toHaveBeenCalledOnce();
  });

  it('calls onEndCall when end call button clicked', async () => {
    const user = userEvent.setup();
    const onEndCall = vi.fn();
    render(<VideoCallControls {...defaultProps} onEndCall={onEndCall} />);
    await user.click(screen.getByTitle('End call'));
    expect(onEndCall).toHaveBeenCalledOnce();
  });

  it('calls onToggleVideo when video button clicked', async () => {
    const user = userEvent.setup();
    const onToggleVideo = vi.fn();
    render(<VideoCallControls {...defaultProps} onToggleVideo={onToggleVideo} />);
    await user.click(screen.getByTitle('Turn off camera'));
    expect(onToggleVideo).toHaveBeenCalledOnce();
  });

  it('does not render screen share button when handler not provided', () => {
    render(<VideoCallControls {...defaultProps} />);
    expect(screen.queryByTitle('Share screen')).not.toBeInTheDocument();
  });

  it('renders screen share button when handler is provided', () => {
    render(<VideoCallControls {...defaultProps} onToggleScreenShare={vi.fn()} />);
    expect(screen.getByTitle('Share screen')).toBeInTheDocument();
  });

  it('shows stop sharing title when screen is being shared', () => {
    render(
      <VideoCallControls {...defaultProps} isScreenSharing={true} onToggleScreenShare={vi.fn()} />
    );
    expect(screen.getByTitle('Stop sharing')).toBeInTheDocument();
  });

  it('applies muted styles when muted', () => {
    render(<VideoCallControls {...defaultProps} isMuted={true} />);
    const muteBtn = screen.getByTitle('Unmute');
    expect(muteBtn.className).toContain('bg-red-600');
  });

  it('applies non-muted styles when not muted', () => {
    render(<VideoCallControls {...defaultProps} isMuted={false} />);
    const muteBtn = screen.getByTitle('Mute');
    expect(muteBtn.className).toContain('bg-white/10');
  });
});
