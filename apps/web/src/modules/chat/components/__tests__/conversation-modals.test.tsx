/** @module ConversationModals tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const cache = new Map<string | symbol, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>();
  return {
    motion: new Proxy({} as Record<string, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>, {
      get: (_target, prop) => {
        if (!cache.has(prop)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Tag = (typeof prop === 'string' ? prop : 'div') as any;
          cache.set(prop, function MotionMock({ children, className, onClick }) {
            return <Tag className={className as string} onClick={onClick as React.MouseEventHandler}>{children}</Tag>;
          });
        }
        return cache.get(prop);
      },
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('@/modules/chat/components/e2-ee-connection-tester', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="e2ee-tester">
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

vi.mock('@/modules/chat/components/e2-ee-error-modal', () => ({
  E2EEErrorModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="e2ee-error-modal" /> : null,
}));

vi.mock('@/modules/chat/components/forward-message-modal', () => ({
  ForwardMessageModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="forward-modal" /> : null,
}));

vi.mock('@/modules/chat/components/message-search', () => ({
  MessageSearch: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="message-search" /> : null,
}));

vi.mock('@/modules/chat/components/schedule-message-modal', () => ({
  ScheduleMessageModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="schedule-modal" /> : null,
}));

vi.mock('@/modules/chat/components/scheduled-messages-list', () => ({
  ScheduledMessagesList: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="scheduled-list" /> : null,
}));

vi.mock('@/modules/calls/components/voice-call-modal', () => ({
  VoiceCallModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="voice-call-modal" /> : null,
}));

vi.mock('@/modules/calls/components/video-call-modal', () => ({
  VideoCallModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="video-call-modal" /> : null,
}));

vi.mock('@/modules/chat/components/chat-info-panel', () => ({
  __esModule: true,
  default: () => <div data-testid="chat-info-panel" />,
}));

import { ConversationModals } from '../conversation-modals';

const baseProps = {
  conversationId: 'conv-1',
  showE2EETester: false,
  setShowE2EETester: vi.fn(),
  otherParticipantUserId: 'u2',
  conversationName: 'Alice',
  showE2EEError: false,
  setShowE2EEError: vi.fn(),
  e2eeErrorMessage: '',
  onRetryE2EE: vi.fn(),
  onSendUnencrypted: vi.fn(),
  setPendingMessage: vi.fn(),
  showForwardModal: false,
  setShowForwardModal: vi.fn(),
  messageToForward: null,
  setMessageToForward: vi.fn(),
  onForwardMessage: vi.fn(),
  showMessageSearch: false,
  setShowMessageSearch: vi.fn(),
  onSearchResultClick: vi.fn(),
  showScheduledList: false,
  setShowScheduledList: vi.fn(),
  onRescheduleClick: vi.fn(),
  showScheduleModal: false,
  setShowScheduleModal: vi.fn(),
  messageToSchedule: '',
  setMessageToSchedule: vi.fn(),
  messageToReschedule: null,
  setMessageToReschedule: vi.fn(),
  onSchedule: vi.fn(),
  showVoiceCallModal: false,
  setShowVoiceCallModal: vi.fn(),
  showVideoCallModal: false,
  setShowVideoCallModal: vi.fn(),
  incomingRoomId: undefined,
  setIncomingRoomId: vi.fn(),
  otherParticipantAvatar: undefined,
  showInfoPanel: false,
  setShowInfoPanel: vi.fn(),
  otherParticipant: {
    user: { id: 'u2', username: 'alice', displayName: 'Alice' },
  },
  isOtherUserOnline: true,
  mutualFriends: [],
};

describe('ConversationModals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with all modals closed', () => {
    const { container } = render(<ConversationModals {...baseProps} />);
    expect(container).toBeTruthy();
  });

  it('shows E2EE tester when showE2EETester is true', () => {
    render(<ConversationModals {...baseProps} showE2EETester />);
    expect(screen.getByTestId('e2ee-tester')).toBeInTheDocument();
  });

  it('hides E2EE tester when otherParticipantUserId is undefined', () => {
    render(<ConversationModals {...baseProps} showE2EETester otherParticipantUserId={undefined} />);
    expect(screen.queryByTestId('e2ee-tester')).not.toBeInTheDocument();
  });

  it('shows message search when showMessageSearch is true', () => {
    render(<ConversationModals {...baseProps} showMessageSearch />);
    expect(screen.getByTestId('message-search')).toBeInTheDocument();
  });

  it('shows voice call modal when showVoiceCallModal is true', () => {
    render(<ConversationModals {...baseProps} showVoiceCallModal />);
    expect(screen.getByTestId('voice-call-modal')).toBeInTheDocument();
  });

  it('shows video call modal when showVideoCallModal is true', () => {
    render(<ConversationModals {...baseProps} showVideoCallModal />);
    expect(screen.getByTestId('video-call-modal')).toBeInTheDocument();
  });

  it('shows schedule modal when showScheduleModal is true', () => {
    render(<ConversationModals {...baseProps} showScheduleModal />);
    expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
  });

  it('shows info panel when showInfoPanel is true', () => {
    render(<ConversationModals {...baseProps} showInfoPanel />);
    expect(screen.getByTestId('chat-info-panel')).toBeInTheDocument();
  });

  it('hides info panel when otherParticipant is null', () => {
    render(<ConversationModals {...baseProps} showInfoPanel otherParticipant={null} />);
    expect(screen.queryByTestId('chat-info-panel')).not.toBeInTheDocument();
  });

  it('shows scheduled list when showScheduledList is true', () => {
    render(<ConversationModals {...baseProps} showScheduledList />);
    expect(screen.getByTestId('scheduled-list')).toBeInTheDocument();
  });
});
