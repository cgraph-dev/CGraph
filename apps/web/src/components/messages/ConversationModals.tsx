import { AnimatePresence } from 'framer-motion';
import { Message } from '@/stores/chatStore';
import E2EEConnectionTester from '@/components/chat/E2EEConnectionTester';
import { E2EEErrorModal } from '@/components/chat/E2EEErrorModal';
import { ForwardMessageModal } from '@/components/chat/ForwardMessageModal';
import { MessageSearch } from '@/components/messages/MessageSearch';
import { ScheduleMessageModal } from '@/components/chat/ScheduleMessageModal';
import { ScheduledMessagesList } from '@/components/chat/ScheduledMessagesList';
import { VoiceCallModal } from '@/components/voice/VoiceCallModal';
import { VideoCallModal } from '@/components/voice/VideoCallModal';
import ChatInfoPanel from '@/components/chat/ChatInfoPanel';

export interface ConversationModalsProps {
  conversationId: string | undefined;
  // E2EE Tester
  showE2EETester: boolean;
  setShowE2EETester: (value: boolean) => void;
  otherParticipantUserId: string | undefined;
  conversationName: string;
  // E2EE Error
  showE2EEError: boolean;
  setShowE2EEError: (value: boolean) => void;
  e2eeErrorMessage: string;
  onRetryE2EE: () => void;
  onSendUnencrypted: () => void;
  setPendingMessage: (value: null) => void;
  // Forward Modal
  showForwardModal: boolean;
  setShowForwardModal: (value: boolean) => void;
  messageToForward: Message | null;
  setMessageToForward: (value: Message | null) => void;
  onForwardMessage: (conversationIds: string[]) => Promise<void>;
  // Message Search
  showMessageSearch: boolean;
  setShowMessageSearch: (value: boolean) => void;
  onSearchResultClick: (conversationId: string, messageId: string) => void;
  // Scheduled Messages
  showScheduledList: boolean;
  setShowScheduledList: (value: boolean) => void;
  onRescheduleClick: (message: Message) => void;
  // Schedule Modal
  showScheduleModal: boolean;
  setShowScheduleModal: (value: boolean) => void;
  messageToSchedule: string;
  setMessageToSchedule: (value: string) => void;
  messageToReschedule: Message | null;
  setMessageToReschedule: (value: Message | null) => void;
  onSchedule: (scheduledAt: Date) => Promise<void>;
  // Voice/Video Calls
  showVoiceCallModal: boolean;
  setShowVoiceCallModal: (value: boolean) => void;
  showVideoCallModal: boolean;
  setShowVideoCallModal: (value: boolean) => void;
  incomingRoomId: string | undefined;
  setIncomingRoomId: (value: string | undefined) => void;
  otherParticipantAvatar: string | undefined;
  // Info Panel
  showInfoPanel: boolean;
  setShowInfoPanel: (value: boolean) => void;
  otherParticipant: {
    user?: {
      id?: string;
      username?: string;
      displayName?: string;
      avatarUrl?: string | null;
      level?: number;
      xp?: number;
      karma?: number;
      streak?: number;
      lastSeenAt?: string | null;
      bio?: string | null;
      badges?: unknown[];
      theme?: unknown;
      sharedForums?: unknown[];
    };
  } | null;
  isOtherUserOnline: boolean;
  mutualFriends: Array<{ id: string; username: string; avatarUrl?: string }>;
}

/**
 * ConversationModals - All modal components used in conversation view
 * Centralizes modal rendering for cleaner main component
 */
export function ConversationModals({
  conversationId,
  // E2EE Tester
  showE2EETester,
  setShowE2EETester,
  otherParticipantUserId,
  conversationName,
  // E2EE Error
  showE2EEError,
  setShowE2EEError,
  e2eeErrorMessage,
  onRetryE2EE,
  onSendUnencrypted,
  setPendingMessage,
  // Forward Modal
  showForwardModal,
  setShowForwardModal,
  messageToForward,
  setMessageToForward,
  onForwardMessage,
  // Message Search
  showMessageSearch,
  setShowMessageSearch,
  onSearchResultClick,
  // Scheduled Messages
  showScheduledList,
  setShowScheduledList,
  onRescheduleClick,
  // Schedule Modal
  showScheduleModal,
  setShowScheduleModal,
  messageToSchedule,
  setMessageToSchedule,
  messageToReschedule,
  setMessageToReschedule,
  onSchedule,
  // Voice/Video Calls
  showVoiceCallModal,
  setShowVoiceCallModal,
  showVideoCallModal,
  setShowVideoCallModal,
  incomingRoomId,
  setIncomingRoomId,
  otherParticipantAvatar,
  // Info Panel
  showInfoPanel,
  setShowInfoPanel,
  otherParticipant,
  isOtherUserOnline,
  mutualFriends,
}: ConversationModalsProps) {
  return (
    <>
      {/* E2EE Connection Tester Modal */}
      <AnimatePresence>
        {showE2EETester && otherParticipantUserId && (
          <E2EEConnectionTester
            conversationId={conversationId || ''}
            recipientId={otherParticipantUserId}
            recipientName={conversationName}
            onClose={() => setShowE2EETester(false)}
          />
        )}
      </AnimatePresence>

      {/* E2EE Error Modal */}
      <E2EEErrorModal
        isOpen={showE2EEError}
        onClose={() => {
          setShowE2EEError(false);
          setPendingMessage(null);
        }}
        onRetry={onRetryE2EE}
        onSendUnencrypted={onSendUnencrypted}
        errorMessage={e2eeErrorMessage}
        recipientName={conversationName}
      />

      {/* Forward Message Modal */}
      {messageToForward && (
        <ForwardMessageModal
          isOpen={showForwardModal}
          onClose={() => {
            setShowForwardModal(false);
            setMessageToForward(null);
          }}
          onForward={onForwardMessage}
          message={messageToForward}
        />
      )}

      {/* Message Search Panel */}
      <MessageSearch
        isOpen={showMessageSearch}
        onClose={() => setShowMessageSearch(false)}
        onResultClick={onSearchResultClick}
        conversationId={conversationId}
      />

      {/* Scheduled Messages List */}
      {conversationId && (
        <ScheduledMessagesList
          isOpen={showScheduledList}
          onClose={() => setShowScheduledList(false)}
          conversationId={conversationId}
          onReschedule={onRescheduleClick}
        />
      )}

      {/* Schedule Message Modal */}
      <ScheduleMessageModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setMessageToSchedule('');
          setMessageToReschedule(null);
        }}
        onSchedule={onSchedule}
        messagePreview={messageToSchedule}
      />

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={showVoiceCallModal}
        onClose={() => {
          setShowVoiceCallModal(false);
          setIncomingRoomId(undefined);
        }}
        conversationId={conversationId || ''}
        otherParticipantId={otherParticipant?.user?.id || ''}
        otherParticipantName={conversationName}
        otherParticipantAvatar={otherParticipantAvatar}
        incomingRoomId={incomingRoomId}
      />

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={showVideoCallModal}
        onClose={() => {
          setShowVideoCallModal(false);
          setIncomingRoomId(undefined);
        }}
        conversationId={conversationId || ''}
        otherParticipantId={otherParticipant?.user?.id || ''}
        otherParticipantName={conversationName}
        otherParticipantAvatar={otherParticipantAvatar}
        incomingRoomId={incomingRoomId}
      />

      {/* User Info Panel (Right Sidebar) */}
      <AnimatePresence>
        {showInfoPanel && otherParticipant && conversationId && (
          <ChatInfoPanel
            userId={otherParticipant?.user?.id || ''}
            conversationId={conversationId}
            user={{
              id: otherParticipant?.user?.id || '',
              username: otherParticipant?.user?.username || 'Unknown',
              displayName: otherParticipant?.user?.displayName || otherParticipant?.user?.username,
              avatarUrl: otherParticipant?.user?.avatarUrl ?? undefined,
              level: otherParticipant?.user?.level ?? 1,
              xp: otherParticipant?.user?.xp ?? 0,
              karma: otherParticipant?.user?.karma ?? 0,
              streak: otherParticipant?.user?.streak ?? 0,
              onlineStatus: isOtherUserOnline ? 'online' : 'offline',
              lastSeenAt: otherParticipant?.user?.lastSeenAt ?? undefined,
              bio: otherParticipant?.user?.bio ?? undefined,
              badges: (otherParticipant?.user?.badges ?? []) as unknown as Array<{
                id: string;
                name: string;
                emoji: string;
                rarity: string;
              }>,
              theme: otherParticipant?.user?.theme ?? undefined,
            }}
            mutualFriends={mutualFriends}
            sharedForums={otherParticipant?.user?.sharedForums ?? []}
            onClose={() => setShowInfoPanel(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default ConversationModals;
