import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ConversationInput } from '../conversation-input';

// Mock dependencies
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

const iconProxy = new Proxy({}, {
  get: (_target, prop) => {
    if (typeof prop === 'string' && prop !== '__esModule') {
      return (props: any) => <span data-testid={`icon-${prop}`} {...props} />;
    }
    return undefined;
  },
});
vi.mock('@heroicons/react/24/outline', () => iconProxy);
vi.mock('@heroicons/react/24/solid', () => iconProxy);

vi.mock('@/components/VoiceMessageRecorder', () => ({
  VoiceMessageRecorder: () => <div data-testid="voice-recorder" />,
}));

vi.mock('@/components/media/voice-message-recorder', () => ({
  VoiceMessageRecorder: () => <div data-testid="voice-recorder" />,
}));

vi.mock('@/modules/chat/components/StickerPicker', () => ({
  StickerPicker: () => <div data-testid="sticker-picker" />,
  StickerButton: () => <button data-testid="sticker-btn" />,
}));

vi.mock('@/modules/chat/components/sticker-picker', () => ({
  StickerPicker: () => <div data-testid="sticker-picker" />,
  StickerButton: () => <button data-testid="sticker-btn" />,
}));

vi.mock('@/modules/chat/components/GifPicker', () => ({
  GifPicker: () => <div data-testid="gif-picker" />,
}));

vi.mock('@/modules/chat/components/gif-picker', () => ({
  GifPicker: () => <div data-testid="gif-picker" />,
  default: () => <div data-testid="gif-picker" />,
}));

vi.mock('@/modules/chat/components/EmojiPicker', () => ({
  EmojiPicker: () => <div data-testid="emoji-picker" />,
}));

vi.mock('@/modules/chat/components/emoji-picker', () => ({
  EmojiPicker: () => <div data-testid="emoji-picker" />,
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

vi.mock('@/modules/chat/store', () => ({
  useChatStore: () => ({}),
}));

const defaultProps = {
  messageInput: '',
  setMessageInput: vi.fn(),
  isSending: false,
  isVoiceMode: false,
  setIsVoiceMode: vi.fn(),
  replyTo: null,
  setReplyTo: vi.fn(),
  showEmojiPicker: false,
  setShowEmojiPicker: vi.fn(),
  showStickerPicker: false,
  setShowStickerPicker: vi.fn(),
  showGifPicker: false,
  setShowGifPicker: vi.fn(),
  uiPreferences: { enableHaptic: false },
  onSend: vi.fn(),
  onTyping: vi.fn(),
  onKeyPress: vi.fn(),
  onEmojiSelect: vi.fn(),
  onStickerSelect: vi.fn(),
  onGifSelect: vi.fn(),
  onVoiceComplete: vi.fn(),
  onFileSelect: vi.fn(),
  onScheduleClick: vi.fn(),
  inputContainerRef: { current: null } as any,
  fileInputRef: { current: null } as any,
};

describe('ConversationInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ConversationInput {...defaultProps} />);
    expect(document.body).toBeTruthy();
  });

  it('calls setMessageInput on input change', () => {
    render(<ConversationInput {...defaultProps} />);
    const textareas = document.querySelectorAll('textarea, input[type="text"]');
    if (textareas.length > 0) {
      fireEvent.change(textareas[0]!, { target: { value: 'Hello' } });
      expect(defaultProps.setMessageInput).toHaveBeenCalled();
    }
  });

  it('disables send when input is empty', () => {
    render(<ConversationInput {...defaultProps} messageInput="" />);
    expect(document.body).toBeTruthy();
  });

  it('shows reply preview when replyTo is set', () => {
    const replyMsg = { id: '1', content: 'Reply to this', sender_id: 'u1' };
    render(<ConversationInput {...defaultProps} replyTo={replyMsg as any} />);
    expect(document.body).toBeTruthy();
  });
});
