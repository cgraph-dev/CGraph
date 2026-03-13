/**
 * Enhanced Conversation Component
 *
 * Next-generation messaging UI with advanced animations, 3D effects,
 * AI-powered themes, and mobile-inspired interactions.
 */

import { motion } from 'motion/react';
import ShaderBackground from '@/components/shaders/shader-background';
import { useEnhancedConversation } from './useEnhancedConversation';
import { EnhancedMessageBubble } from './enhanced-message-bubble';
import { ConversationHeader } from './conversation-header';
import { MessageInputArea } from './message-input-area';
import { TypingIndicator } from './typing-indicator';
import { LoadingSpinner } from './loading-spinner';
import { tweens } from '@/lib/animation-presets';

/**
 * Enhanced Conversation component.
 */
export default function EnhancedConversation() {
  const {
    conversation,
    conversationMessages,
    typing,
    user,
    messageInput,
    setMessageInput,
    isSending,
    setReplyTo,
    showStickerPicker,
    setShowStickerPicker,
    messagesEndRef,
    inputContainerRef,
    handleSend,
    handleStickerSelect,
    handleGenerateTheme,
    handleAvatarClick,
  } = useEnhancedConversation();

  if (!conversation) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {/* WebGL Shader Background */}
      <ShaderBackground
        variant="fluid"
        color1="#00ff41"
        color2="#003b00"
        color3="#39ff14"
        speed={0.4}
        intensity={0.8}
        interactive
      />

      {/* Main Container */}
      <motion.div
        className="relative flex h-full max-h-screen flex-1 flex-col overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={tweens.smooth}
      >
        {/* Header */}
        <ConversationHeader
          conversationName={conversation.name || 'Conversation'}
          isTyping={typing.length > 0}
          onGenerateTheme={handleGenerateTheme}
        />

        {/* Messages Area */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          {conversationMessages.map((message, index) => {
            const isOwn = message.senderId === user?.id;
            const prevMessage = conversationMessages[index - 1];
            const showAvatar =
              !isOwn && (!prevMessage || prevMessage.senderId !== message.senderId);

            return (
              <EnhancedMessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                onReply={() => setReplyTo(message)}
                index={index}
                onAvatarClick={handleAvatarClick}
              />
            );
          })}

          {/* Typing indicator */}
          <TypingIndicator isVisible={typing.length > 0} />

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <MessageInputArea
          messageInput={messageInput}
          isSending={isSending}
          showStickerPicker={showStickerPicker}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          inputContainerRef={inputContainerRef as React.RefObject<HTMLDivElement>} // safe downcast – DOM element
          onMessageChange={setMessageInput}
          onSend={handleSend}
          onToggleStickerPicker={() => setShowStickerPicker(!showStickerPicker)}
          onStickerSelect={handleStickerSelect}
        />
      </motion.div>
    </>
  );
}
