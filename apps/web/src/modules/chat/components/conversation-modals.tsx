/**
 * Conversation info and settings modals.
 * @module
 */
import { AnimatePresence } from 'framer-motion';
import { Message } from '@/modules/chat/store';
import E2EEConnectionTester from '@/modules/chat/components/e2-ee-connection-tester';
import { E2EEErrorModal } from '@/modules/chat/components/e2-ee-error-modal';
import { ForwardMessageModal } from '@/modules/chat/components/forward-message-modal';
import { MessageSearch } from '@/modules/chat/components/message-search';
import { ScheduleMessageModal } from '@/modules/chat/components/schedule-message-modal';
import { ScheduledMessagesList } from '@/modules/chat/components/scheduled-messages-list';
import { VoiceCallModal } from '@/modules/calls/components/voice-call-modal';
import { VideoCallModal } from '@/modules/calls/components/video-call-modal';
import ChatInfoPanel from '@/modules/chat/components/chat-info-panel';
import { SafetyNumberDialog } from '@/modules/chat/components/safety-number-dialog';

export interface ConversationModalsProps {
  conversationId: string | undefined;
  // E2EE Tester
  showE2EETester: boolean;
  setShowE2EETester: (value: boolean) => void;
  otherParticipantUserId: string | undefined;
  conversationName: string;
  // Safety Number
  showSafetyNumber: boolean;
  setShowSafetyNumber: (value: boolean) => void;
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
  // Safety Number
  showSafetyNumber,
  setShowSafetyNumber,
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
  messageToReschedule: _messageToReschedule,
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

      {/* Safety Number Verification Dialog */}
      {otherParticipantUserId && (
        <SafetyNumberDialog
          recipientId={otherParticipantUserId}
          recipientName={conversationName}
          isOpen={showSafetyNumber}
          onClose={() => setShowSafetyNumber(false)}
        />
      )}

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
                // type assertion: badge type mismatch between API and component
                id: string;
                name: string;
                emoji: string;
                rarity: string;
              }>,
            }}
            mutualFriends={mutualFriends}
            sharedForums={
              // type assertion: optional chaining fallback to empty array, shape matches component prop
               
              (otherParticipant?.user?.sharedForums ?? []) as {
                id: string;
                name: string;
                icon?: string;
              }[] // type assertion: shared forums shape matches component prop type
            }
            onClose={() => setShowInfoPanel(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default ConversationModals;
