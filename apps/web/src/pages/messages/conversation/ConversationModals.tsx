/**
 * Conversation Modals
 *
 * All overlay/modal components used in the conversation view:
 * E2EE tester, E2EE error, forward message, message search,
 * scheduled messages, schedule modal, call modals, and chat info panel.
 *
 * @module pages/messages/conversation/ConversationModals
 */

import { AnimatePresence } from 'framer-motion';
import E2EEConnectionTester from '@/modules/chat/components/E2EEConnectionTester';
import { E2EEErrorModal } from '@/modules/chat/components/E2EEErrorModal';
import ChatInfoPanel from '@/modules/chat/components/ChatInfoPanel';
import { VoiceCallModal } from '@/modules/calls/components/VoiceCallModal';
import { VideoCallModal } from '@/modules/calls/components/VideoCallModal';
import type { MutualFriend } from './types';

/** Props for the E2EE tester modal */
export interface E2EEModalProps {
  /** Whether to show the E2EE tester */
  showE2EETester: boolean;
  /** Other participant's user ID */
  otherParticipantUserId: string | undefined;
  /** Conversation ID */
  conversationId: string;
  /** Display name for the other participant */
  conversationName: string;
  /** Close callback */
  onClose: () => void;
}

/**
 * E2EE Connection Tester overlay.
 */
export function E2EETesterModal({
  showE2EETester,
  otherParticipantUserId,
  conversationId,
  conversationName,
  onClose,
}: E2EEModalProps) {
  return (
    <AnimatePresence>
      {showE2EETester && otherParticipantUserId && (
        <E2EEConnectionTester
          conversationId={conversationId}
          recipientId={otherParticipantUserId}
          recipientName={conversationName}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
}

/** Props for E2EE error modal */
export interface E2EEErrorProps {
  /** Whether the error modal is open */
  isOpen: boolean;
  /** Error description */
  errorMessage: string;
  /** Recipient display name */
  recipientName: string;
  /** Callbacks */
  onClose: () => void;
  onRetry: () => void;
  onSendUnencrypted: () => void;
}

/**
 * E2EE error modal with retry/unencrypted options.
 */
export function E2EEError({
  isOpen,
  errorMessage,
  recipientName,
  onClose,
  onRetry,
  onSendUnencrypted,
}: E2EEErrorProps) {
  return (
    <E2EEErrorModal
      isOpen={isOpen}
      onClose={onClose}
      onRetry={onRetry}
      onSendUnencrypted={onSendUnencrypted}
      errorMessage={errorMessage}
      recipientName={recipientName}
    />
  );
}

/** Props for call modals */
export interface CallModalsProps {
  /** Whether voice call modal is open */
  showVoiceCallModal: boolean;
  /** Whether video call modal is open */
  showVideoCallModal: boolean;
  /** Conversation ID */
  conversationId: string;
  /** Other participant details */
  otherParticipant: {
    user?: {
      id?: string;
      avatarUrl?: string | null;
    };
  } | null;
  /** Conversation display name */
  conversationName: string;
  /** Room ID for incoming calls */
  incomingRoomId: string | null | undefined;
  /** Close callbacks */
  onCloseVoice: () => void;
  onCloseVideo: () => void;
}

/**
 * Voice and video call modals.
 */
export function CallModals({
  showVoiceCallModal,
  showVideoCallModal,
  conversationId,
  otherParticipant,
  conversationName,
  incomingRoomId,
  onCloseVoice,
  onCloseVideo,
}: CallModalsProps) {
  return (
    <>
      <VoiceCallModal
        isOpen={showVoiceCallModal}
        onClose={onCloseVoice}
        conversationId={conversationId}
        otherParticipantId={otherParticipant?.user?.id || ''}
        otherParticipantName={conversationName}
        otherParticipantAvatar={(otherParticipant?.user?.avatarUrl as string) ?? undefined}
        incomingRoomId={incomingRoomId ?? undefined}
      />
      <VideoCallModal
        isOpen={showVideoCallModal}
        onClose={onCloseVideo}
        conversationId={conversationId}
        otherParticipantId={otherParticipant?.user?.id || ''}
        otherParticipantName={conversationName}
        otherParticipantAvatar={(otherParticipant?.user?.avatarUrl as string) ?? undefined}
        incomingRoomId={incomingRoomId ?? undefined}
      />
    </>
  );
}

/** Props for info panel */
export interface InfoPanelProps {
  /** Whether the panel is visible */
  showInfoPanel: boolean;
  /** Other participant data */
  otherParticipant: Record<string, unknown> | null;
  /** Conversation ID */
  conversationId: string;
  /** Whether the other user is online */
  isOtherUserOnline: boolean;
  /** Mutual friends list */
  mutualFriends: MutualFriend[];
  /** Close callback */
  onClose: () => void;
}

/**
 * Chat info side panel with user details.
 */
export function InfoPanel({
  showInfoPanel,
  otherParticipant,
  conversationId,
  isOtherUserOnline,
  mutualFriends,
  onClose,
}: InfoPanelProps) {
  const user = (otherParticipant as Record<string, unknown>)?.user as
    | Record<string, unknown>
    | undefined;

  return (
    <AnimatePresence>
      {showInfoPanel && otherParticipant && conversationId && (
        <ChatInfoPanel
          userId={(user?.id as string) || ''}
          conversationId={conversationId}
          user={{
            id: (user?.id as string) || '',
            username: (user?.username as string) || 'Unknown',
            displayName: (user?.displayName as string) || (user?.username as string),
            avatarUrl: (user?.avatarUrl as string) ?? undefined,
            level: (user?.level as number) ?? 1,
            xp: (user?.xp as number) ?? 0,
            karma: (user?.karma as number) ?? 0,
            streak: (user?.streak as number) ?? 0,
            onlineStatus: isOtherUserOnline ? 'online' : 'offline',
            lastSeenAt: (user?.lastSeenAt as string) ?? undefined,
            bio: (user?.bio as string) ?? undefined,
            badges: ((user?.badges as unknown[]) ?? []) as unknown as Array<{
              id: string;
              name: string;
              emoji: string;
              rarity: string;
            }>,
          }}
          mutualFriends={mutualFriends}
          sharedForums={
            (user?.sharedForums ?? []) as Array<{
              id: string;
              name: string;
              icon: string;
              memberCount: number;
            }>
          }
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
}
