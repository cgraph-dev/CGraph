/**
 * AttachmentPreviewModal Component
 * 
 * Preview modal for pending attachments before sending.
 * Supports images, videos, and documents with captions.
 * 
 * @module components/conversation/AttachmentPreviewModal
 * @since v0.7.29
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AttachmentVideoPreview } from './AttachmentVideoPreview';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface PendingAttachment {
  uri: string;
  type: 'image' | 'video' | 'file';
  name?: string;
  mimeType?: string;
  duration?: number;
}

export interface AttachmentPreviewModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Array of pending attachments to preview */
  attachments: PendingAttachment[];
  /** Caption text for the attachments */
  caption: string;
  /** Animation value for entrance animation */
  animation: Animated.Value;
  /** Theme colors */
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    surface: string;
    background: string;
  };
  /** Callback when caption changes */
  onCaptionChange: (text: string) => void;
  /** Callback to remove an attachment at index */
  onRemoveAttachment: (index: number) => void;
  /** Callback to add more attachments */
  onAddMore: () => void;
  /** Callback to send all attachments */
  onSend: () => void;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Returns the appropriate icon for a file type based on MIME type.
 */
const getFileIcon = (mimeType?: string): string => {
  if (!mimeType) return 'document-attach';
  if (mimeType.includes('pdf')) return 'document-text';
  if (mimeType.includes('word')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'grid';
  return 'document-attach';
};

/**
 * Full-screen preview modal for attachments before sending.
 * 
 * Features:
 * - Horizontal swipe for multiple attachments
 * - Caption input with multiline support
 * - Remove individual attachments
 * - Add more attachments button
 * - Video thumbnail preview
 * - File type icons for documents
 * 
 * @example
 * ```tsx
 * <AttachmentPreviewModal
 *   visible={showPreview}
 *   attachments={pendingFiles}
 *   caption={captionText}
 *   animation={previewAnim}
 *   colors={themeColors}
 *   onCaptionChange={setCaption}
 *   onRemoveAttachment={handleRemove}
 *   onAddMore={pickMore}
 *   onSend={sendAttachments}
 *   onClose={closePreview}
 * />
 * ```
 */
export const AttachmentPreviewModal = memo(function AttachmentPreviewModal({
  visible,
  attachments,
  caption,
  animation,
  colors,
  onCaptionChange,
  onRemoveAttachment,
  onAddMore,
  onSend,
  onClose,
}: AttachmentPreviewModalProps) {
  const renderAttachment = useCallback(
    (attachment: PendingAttachment, index: number) => {
      const scaleInterpolation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
      });

      return (
        <Animated.View
          key={index}
          style={[
            styles.previewItem,
            attachments.length > 1 && { width: SCREEN_WIDTH - 40 },
            { transform: [{ scale: scaleInterpolation }] },
          ]}
        >
          {/* Remove button */}
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemoveAttachment(index)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.removeBtnInner}>
              <Ionicons name="close" size={18} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Content based on type */}
          {attachment.type === 'image' ? (
            <Image
              source={{ uri: attachment.uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : attachment.type === 'video' ? (
            <AttachmentVideoPreview uri={attachment.uri} duration={attachment.duration} />
          ) : (
            <View style={styles.previewFile}>
              <View style={[styles.fileIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name={getFileIcon(attachment.mimeType) as any} size={48} color="#fff" />
              </View>
              <Text style={styles.fileName} numberOfLines={2}>
                {attachment.name}
              </Text>
              <Text style={styles.fileType}>
                {attachment.mimeType?.split('/').pop()?.toUpperCase() || 'FILE'}
              </Text>
            </View>
          )}

          {/* Index indicator */}
          {attachments.length > 1 && (
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>
                {index + 1}/{attachments.length}
              </Text>
            </View>
          )}
        </Animated.View>
      );
    },
    [attachments.length, animation, colors.primary, onRemoveAttachment]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[styles.container, { opacity: animation, backgroundColor: 'rgba(0,0,0,0.95)' }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {attachments.length} {attachments.length === 1 ? 'item' : 'items'} selected
            </Text>
            <TouchableOpacity
              onPress={onAddMore}
              style={styles.addBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Preview Area */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            horizontal={attachments.length > 1}
            pagingEnabled={attachments.length > 1}
            showsHorizontalScrollIndicator={attachments.length > 1}
          >
            {attachments.map(renderAttachment)}
          </ScrollView>

          {/* Footer: Caption + Send */}
          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            <View style={[styles.captionContainer, { backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.captionInput, { color: colors.text }]}
                placeholder="Add a caption..."
                placeholderTextColor={colors.textSecondary}
                value={caption}
                onChangeText={onCaptionChange}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.primary }]}
              onPress={onSend}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  addBtn: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  previewItem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  removeBtnInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: SCREEN_WIDTH - 60,
    height: SCREEN_HEIGHT * 0.5,
    borderRadius: 12,
  },
  previewFile: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    width: SCREEN_WIDTH - 80,
  },
  fileIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  fileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  fileType: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  indexBadge: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  indexText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 34,
    gap: 12,
  },
  captionContainer: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  captionInput: {
    fontSize: 16,
    maxHeight: 76,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AttachmentPreviewModal;
