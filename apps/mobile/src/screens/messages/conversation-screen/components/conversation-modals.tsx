/**
 * Consolidated modals for the conversation screen.
 * Renders all overlay / modal components in one place.
 * @module screens/messages/conversation-screen/components/conversation-modals
 */
import React from 'react';
import { Animated } from 'react-native';
import { AttachmentPicker } from '../../../components';
import {
  MessageActionsMenu,
  ReactionPickerModal,
  AttachmentPreviewModal,
  ImageViewerModal,
  VideoPlayerModal,
} from './components';
import type { GifPickerModal } from './components/gif-picker-modal';
import type { Message } from '../../../types';

interface ConversationModalsProps {
  // Attachment picker
  showAttachMenu: boolean;
  closeAttachMenu: () => void;
  onSelectAssets: (assets: Array<{ uri: string; type: 'image' | 'video' | 'file'; name?: string; mimeType?: string; duration?: number }>) => void;
  // Message actions
  showMessageActions: boolean;
  selectedMessage: Message | null;
  isOwnMessage: boolean;
  isDark: boolean;
  colors: Record<string, unknown>;
  messageActionsAnim: Animated.Value;
  backdropAnim: Animated.Value;
  menuScaleAnim: Animated.Value;
  actionItemAnims: Animated.Value[];
  closeMessageActions: () => void;
  onReply: () => void;
  onEdit: () => void;
  onTogglePin: () => void;
  onUnsend: () => void;
  onQuickReaction: () => void;
  onOpenReactionPicker: () => void;
  getReactionState: () => Record<string, boolean>;
  // Reaction picker
  showReactionPicker: boolean;
  reactionPickerMessage: Message | null;
  selectedEmojiCategory: string;
  closeReactionPicker: () => void;
  setSelectedEmojiCategory: (c: string) => void;
  handleAddReaction: (conversationId: string, messageId: string, emoji: string) => Promise<void>;
  handleRemoveReaction: (conversationId: string, messageId: string, emoji: string) => Promise<void>;
  conversationId: string;
  // Attachment preview
  showAttachmentPreview: boolean;
  pendingAttachments: Array<{ uri: string; type: string; name?: string; mimeType?: string; duration?: number }>;
  attachmentCaption: string;
  attachmentPreviewAnim: Animated.Value;
  closeAttachmentPreview: () => void;
  addMoreAttachments: () => void;
  removeAttachment: (index: number) => void;
  setAttachmentCaption: (caption: string) => void;
  sendPendingAttachments: () => void;
  // Image viewer
  showImageViewer: boolean;
  selectedImage: string | null;
  imageGallery: string[];
  currentImageIndex: number;
  imageGalleryRef: React.MutableRefObject<unknown>;
  imageViewerAnim: Animated.Value;
  imageScaleAnim: Animated.Value;
  closeImageViewer: () => void;
  setCurrentImageIndex: (i: number) => void;
  setSelectedImage: (s: string | null) => void;
  // Video player
  showVideoPlayer: boolean;
  selectedVideoUrl: string | null;
  selectedVideoDuration: number;
  closeVideoPlayer: () => void;
  // GIF picker
  showGifPicker: boolean;
  setShowGifPicker: (v: boolean) => void;
  handleGifSelect: (gif: { id: string; url: string; title: string; previewUrl: string; width: number; height: number }) => void;
}

export function ConversationModals(props: ConversationModalsProps) {
  return (
    <>
      <AttachmentPicker
        visible={props.showAttachMenu}
        onClose={props.closeAttachMenu}
        onSelectAssets={props.onSelectAssets}
        maxSelection={10}
      />

      <MessageActionsMenu
        visible={props.showMessageActions}
        selectedMessage={props.selectedMessage}
        isOwnMessage={props.isOwnMessage}
        isDark={props.isDark}
        colors={props.colors}
        messageActionsAnim={props.messageActionsAnim}
        backdropAnim={props.backdropAnim}
        menuScaleAnim={props.menuScaleAnim}
        actionItemAnims={props.actionItemAnims}
        onClose={props.closeMessageActions}
        onReply={props.onReply}
        onEdit={props.onEdit}
        onTogglePin={props.onTogglePin}
        onUnsend={props.onUnsend}
        onQuickReaction={props.onQuickReaction}
        onOpenReactionPicker={props.onOpenReactionPicker}
        getReactionState={props.getReactionState}
      />

      <ReactionPickerModal
        visible={props.showReactionPicker}
        message={props.reactionPickerMessage}
        selectedCategory={props.selectedEmojiCategory}
        isDark={props.isDark}
        colors={props.colors}
        onClose={props.closeReactionPicker}
        onSelectCategory={props.setSelectedEmojiCategory}
        onAddReaction={props.handleAddReaction}
        onRemoveReaction={props.handleRemoveReaction}
      />

      <AttachmentPreviewModal
        visible={props.showAttachmentPreview}
        attachments={props.pendingAttachments}
        caption={props.attachmentCaption}
        animValue={props.attachmentPreviewAnim}
        colors={props.colors}
        onClose={props.closeAttachmentPreview}
        onAddMore={props.addMoreAttachments}
        onRemove={props.removeAttachment}
        onCaptionChange={props.setAttachmentCaption}
        onSend={props.sendPendingAttachments}
      />

      <ImageViewerModal
        visible={props.showImageViewer}
        selectedImage={props.selectedImage}
        imageGallery={props.imageGallery}
        currentIndex={props.currentImageIndex}
        galleryRef={props.imageGalleryRef}
        animValue={props.imageViewerAnim}
        scaleAnim={props.imageScaleAnim}
        onClose={props.closeImageViewer}
        onIndexChange={props.setCurrentImageIndex}
        onImageSelect={props.setSelectedImage}
      />

      <VideoPlayerModal
        visible={props.showVideoPlayer}
        videoUrl={props.selectedVideoUrl}
        duration={props.selectedVideoDuration}
        onClose={props.closeVideoPlayer}
      />

      <GifPickerModal
        visible={props.showGifPicker}
        onClose={() => props.setShowGifPicker(false)}
        onSelect={props.handleGifSelect}
      />
    </>
  );
}
