/**
 * Hook providing wrapped message action handlers for the conversation screen.
 * @module screens/messages/conversation-screen/hooks/useMessageActionWrappers
 */
import { useCallback, RefObject } from 'react';
import { TextInput } from 'react-native';
import { Message } from '../../../../types';

interface UseMessageActionWrappersOptions {
  selectedMessage: Message | null;
  inputRef: RefObject<TextInput | null>;
  setReplyingTo: (message: Message | null) => void;
  closeMessageActions: () => void;
  clearReply: () => void;
  hasReacted: (message: Message | null, emoji: string) => boolean;
  handleQuickReactionBase: (
    message: Message,
    emoji: string,
    isReacted: boolean,
    onComplete: () => void
  ) => void;
  openReactionPickerBase: (message: Message) => void;
  handleTogglePinBase: (message: Message) => void;
  handleUnsendBase: (message: Message) => void;
}

interface UseMessageActionWrappersReturn {
  handleReply: () => void;
  cancelReply: () => void;
  handleQuickReaction: (emoji: string) => void;
  openReactionPicker: () => void;
  handleTogglePin: () => void;
  handleUnsend: () => void;
  getReactionState: (emoji: string) => boolean;
}

/**
 * Hook that provides wrapper functions for message actions.
 * Binds the currently selected message to action handlers.
 */
export function useMessageActionWrappers(
  options: UseMessageActionWrappersOptions
): UseMessageActionWrappersReturn {
  const {
    selectedMessage,
    inputRef,
    setReplyingTo,
    closeMessageActions,
    clearReply,
    hasReacted,
    handleQuickReactionBase,
    openReactionPickerBase,
    handleTogglePinBase,
    handleUnsendBase,
  } = options;

  // Handle reply to message (wraps hook's setReplyingTo with focus)
  const handleReply = useCallback(() => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
      closeMessageActions();
      // Focus the input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedMessage, closeMessageActions, setReplyingTo, inputRef]);

  // Cancel reply - use clearReply from hook
  const cancelReply = clearReply;

  // Quick reaction wrapper (uses hook's handleQuickReaction)
  const handleQuickReaction = useCallback(
    (emoji: string) => {
      if (selectedMessage) {
        handleQuickReactionBase(
          selectedMessage,
          emoji,
          hasReacted(selectedMessage, emoji),
          closeMessageActions
        );
      }
    },
    [selectedMessage, hasReacted, closeMessageActions, handleQuickReactionBase]
  );

  // Open full reaction picker (wraps hook's openReactionPicker)
  const openReactionPicker = useCallback(() => {
    if (selectedMessage) {
      openReactionPickerBase(selectedMessage);
      closeMessageActions();
    }
  }, [selectedMessage, closeMessageActions, openReactionPickerBase]);

  // Pin/unpin message wrapper (uses hook's handleTogglePin)
  const handleTogglePin = useCallback(() => {
    if (selectedMessage) {
      handleTogglePinBase(selectedMessage);
    }
  }, [selectedMessage, handleTogglePinBase]);

  // Unsend message wrapper (uses hook's handleUnsend)
  const handleUnsend = useCallback(() => {
    if (selectedMessage) {
      handleUnsendBase(selectedMessage);
    }
  }, [selectedMessage, handleUnsendBase]);

  // Callback for checking reaction state
  const getReactionState = useCallback(
    (emoji: string) => {
      return selectedMessage?.reactions?.some((r) => r.emoji === emoji && r.hasReacted) || false;
    },
    [selectedMessage]
  );

  return {
    handleReply,
    cancelReply,
    handleQuickReaction,
    openReactionPicker,
    handleTogglePin,
    handleUnsend,
    getReactionState,
  };
}
