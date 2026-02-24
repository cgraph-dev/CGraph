/** @module MessageInput tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>{children}</div>
  ),
}));

const mockHandleSend = vi.fn();
const mockHandleChange = vi.fn();
const mockHandleKeyDown = vi.fn();

vi.mock('./useMessageInput', () => ({
  useMessageInput: () => ({
    message: '',
    attachments: [],
    attachmentMode: 'none',
    isRecording: false,
    showMentions: false,
    mentionQuery: '',
    inputRef: { current: null },
    fileInputRef: { current: null },
    handleChange: mockHandleChange,
    handleSend: mockHandleSend,
    handleKeyDown: mockHandleKeyDown,
    handleFileSelect: vi.fn(),
    handleDrop: vi.fn(),
    removeAttachment: vi.fn(),
    handleVoiceMessage: vi.fn(),
    handleStickerSelect: vi.fn(),
    handleGifSelect: vi.fn(),
    handleMentionSelect: vi.fn(),
    toggleAttachmentMode: vi.fn(),
    setIsRecording: vi.fn(),
    setAttachmentMode: vi.fn(),
    setShowMentions: vi.fn(),
  }),
}));

vi.mock('./reply-preview', () => ({
  ReplyPreview: ({ replyTo }: { replyTo?: { content: string } | null }) =>
    replyTo ? <div data-testid="reply-preview">{replyTo.content}</div> : null,
}));

vi.mock('./attachments-preview', () => ({
  AttachmentsPreview: ({ attachments }: { attachments: unknown[] }) => (
    <div data-testid="attachments-preview">{attachments.length} attachments</div>
  ),
}));

vi.mock('./attachment-menu', () => ({
  AttachmentMenu: () => <div data-testid="attachment-menu" />,
}));

vi.mock('./input-toolbar', () => ({
  InputToolbar: () => <div data-testid="input-toolbar" />,
}));

vi.mock('./mention-autocomplete', () => ({
  MentionAutocomplete: () => <div data-testid="mention-autocomplete" />,
}));

vi.mock('@/components/media/voice-message-recorder', () => ({
  VoiceMessageRecorder: () => <div data-testid="voice-recorder" />,
}));

vi.mock('@/modules/chat/components/sticker-picker', () => ({
  StickerPicker: () => <div data-testid="sticker-picker" />,
}));

vi.mock('@/modules/chat/components/gif-picker', () => ({
  GifPicker: () => <div data-testid="gif-picker" />,
}));

import { MessageInput } from '../message-input';

const defaultProps = {
  onSend: vi.fn(),
  onCancelReply: vi.fn(),
  onTyping: vi.fn(),
};

describe('MessageInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the message input textarea', () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<MessageInput {...defaultProps} placeholder="Write here..." />);
    expect(screen.getByPlaceholderText('Write here...')).toBeInTheDocument();
  });

  it('renders attachment menu', () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByTestId('attachment-menu')).toBeInTheDocument();
  });

  it('renders input toolbar', () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByTestId('input-toolbar')).toBeInTheDocument();
  });

  it('renders attachments preview', () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByTestId('attachments-preview')).toBeInTheDocument();
  });

  it('disables textarea when disabled prop is true', () => {
    render(<MessageInput {...defaultProps} disabled />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeDisabled();
  });

  it('renders reply preview when replyTo is provided', () => {
    const replyTo = { id: 'r1', content: 'Original message', author: 'alice' };
    render(<MessageInput {...defaultProps} replyTo={replyTo} />);
    expect(screen.getByTestId('reply-preview')).toHaveTextContent('Original message');
  });

  it('does not render reply preview when replyTo is null', () => {
    render(<MessageInput {...defaultProps} replyTo={null} />);
    expect(screen.queryByTestId('reply-preview')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<MessageInput {...defaultProps} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders hidden file input', () => {
    const { container } = render(<MessageInput {...defaultProps} />);
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');
  });
});
