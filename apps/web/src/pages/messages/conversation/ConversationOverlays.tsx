/**
 * Conversation overlay modals and hidden inputs.
 *
 * Groups E2EE tester, E2EE error dialog, forward modal,
 * message search, scheduled messages, and file input.
 *
 * @module pages/messages/conversation/ConversationOverlays
 */

import { RefObject } from 'react';
import { Message } from '@/modules/chat/store';
import { E2EETesterModal, E2EEError } from './ConversationModals';
import { ForwardMessageModal } from '@/modules/chat/components/ForwardMessageModal';
import { MessageSearch } from '@/modules/chat/components';
import { ScheduledMessagesList } from '@/modules/chat/components/ScheduledMessagesList';
import { ScheduleMessageModal } from '@/modules/chat/components/ScheduleMessageModal';
import type { UIPreferences } from './types';

interface ConversationOverlaysProps {
  conversationId: string;
  conversationName: string;
  otherParticipantUserId: string | undefined;
  uiPreferences: UIPreferences;
  // E2EE tester
  showE2EETester: boolean;
  onCloseE2EETester: () => void;
  // E2EE error
  showE2EEError: boolean;
  e2eeErrorMessage: string;
  onCloseE2EEError: () => void;
  onRetryE2EE: () => void;
  onSendUnencrypted: () => void;
  // Forward modal
  showForwardModal: boolean;
  messageToForward: Message | null;
  onCloseForward: () => void;
  onForwardMessage: (ids: string[]) => Promise<void>;
  // Message search
  showMessageSearch: boolean;
  onCloseSearch: () => void;
  onSearchResultClick: (conversationId: string, messageId: string) => void;
  // Scheduled messages
  showScheduledList: boolean;
  onCloseScheduledList: () => void;
  onReschedule: (msg: Message) => void;
  // Schedule modal
  showScheduleModal: boolean;
  onCloseScheduleModal: () => void;
  onSchedule: (date: Date) => Promise<void>;
  messageToSchedule: string;
  // File input
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ConversationOverlays(props: ConversationOverlaysProps) {
  return (
    <>
      <E2EETesterModal
        showE2EETester={props.showE2EETester}
        otherParticipantUserId={props.otherParticipantUserId}
        conversationId={props.conversationId}
        conversationName={props.conversationName}
        onClose={props.onCloseE2EETester}
      />

      <E2EEError
        isOpen={props.showE2EEError}
        errorMessage={props.e2eeErrorMessage}
        recipientName={props.conversationName}
        onClose={props.onCloseE2EEError}
        onRetry={props.onRetryE2EE}
        onSendUnencrypted={props.onSendUnencrypted}
      />

      {props.messageToForward && (
        <ForwardMessageModal
          isOpen={props.showForwardModal}
          onClose={props.onCloseForward}
          onForward={props.onForwardMessage}
          message={props.messageToForward}
        />
      )}

      <MessageSearch
        isOpen={props.showMessageSearch}
        onClose={props.onCloseSearch}
        onResultClick={props.onSearchResultClick}
        conversationId={props.conversationId}
      />

      {props.conversationId && (
        <ScheduledMessagesList
          isOpen={props.showScheduledList}
          onClose={props.onCloseScheduledList}
          conversationId={props.conversationId}
          onReschedule={props.onReschedule}
        />
      )}

      <ScheduleMessageModal
        isOpen={props.showScheduleModal}
        onClose={props.onCloseScheduleModal}
        onSchedule={props.onSchedule}
        messagePreview={props.messageToSchedule}
      />

      <input
        ref={props.fileInputRef}
        type="file"
        onChange={props.onFileSelect}
        className="hidden"
        accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
      />
    </>
  );
}
