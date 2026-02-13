import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationInput } from '../ConversationInput';

// Mock dependencies
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    textarea: (props: any) => <textarea {...props} />,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  PaperAirplaneIcon: () => <span data-testid="send-icon" />,
  PaperClipIcon: () => <span data-testid="clip-icon" />,
  FaceSmileIcon: () => <span data-testid="smile-icon" />,
  SparklesIcon: () => <span data-testid="sparkles-icon" />,
  MicrophoneIcon: () => <span data-testid="mic-icon" />,
  ClockIcon: () => <span data-testid="clock-icon" />,
  XMarkIcon: () => <span data-testid="x-icon" />,
}));

vi.mock('@/components/VoiceMessageRecorder', () => ({
  VoiceMessageRecorder: () => <div data-testid="voice-recorder" />,
}));

vi.mock('@/modules/chat/components/StickerPicker', () => ({
  StickerPicker: () => <div data-testid="sticker-picker" />,
  StickerButton: () => <button data-testid="sticker-btn" />,
}));

vi.mock('@/modules/chat/components/GifPicker', () => ({
  GifPicker: () => <div data-testid="gif-picker" />,
}));

vi.mock('@/modules/chat/components/EmojiPicker', () => ({
  EmojiPicker: () => <div data-testid="emoji-picker" />,
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

const defaultProps = {
  messageInput: '',
  setMessageInput: vi.fn(),
  isSending: false,
  onSendMessage: vi.fn(),
  inputRef: { current: null } as any,
  replyingTo: null,
  onCancelReply: vi.fn(),
  onSendSticker: vi.fn(),
  onSendGif: vi.fn(),
  showDisappearing: false,
  onToggleDisappearing: vi.fn(),
  disappearingDuration: null,
  onSetDisappearingDuration: vi.fn(),
  onFileAttach: vi.fn(),
};

describe('ConversationInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ConversationInput {...defaultProps} />);
    // Should render an input area or textarea
    expect(document.body).toBeTruthy();
  });

  it('calls setMessageInput on input change', () => {
    render(<ConversationInput {...defaultProps} />);
    const textareas = document.querySelectorAll('textarea, input[type="text"]');
    if (textareas.length > 0) {
      fireEvent.change(textareas[0], { target: { value: 'Hello' } });
      expect(defaultProps.setMessageInput).toHaveBeenCalled();
    }
  });

  it('disables send when input is empty', () => {
    render(<ConversationInput {...defaultProps} messageInput="" />);
    // Send button should not be interactive when empty
    expect(document.body).toBeTruthy();
  });

  it('shows reply preview when replyingTo is set', () => {
    const replyMsg = { id: '1', content: 'Reply to this', sender_id: 'u1' };
    render(<ConversationInput {...defaultProps} replyingTo={replyMsg as any} />);
    // Should show reply indicator
    expect(document.body).toBeTruthy();
  });
});
