/**
 * AttachmentPreviewModal Component
 *
 * Full-screen preview for pending attachments before sending.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, SCREEN_WIDTH } from '../styles';
import { AttachmentVideoPreview } from './VideoComponents';

interface PendingAttachment {
  uri: string;
  type: 'image' | 'file' | 'video';
  name?: string;
  mimeType?: string;
  duration?: number;
}

interface AttachmentPreviewModalProps {
  visible: boolean;
  attachments: PendingAttachment[];
  caption: string;
  animValue: Animated.Value;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    surface: string;
    background: string;
  };
  onClose: () => void;
  onAddMore: () => void;
  onRemove: (index: number) => void;
  onCaptionChange: (text: string) => void;
  onSend: () => void;
}

/**
 * Full-screen attachment preview with caption input.
 */
export function AttachmentPreviewModal({
  visible,
  attachments,
  caption,
  animValue,
  colors,
  onClose,
  onAddMore,
  onRemove,
  onCaptionChange,
  onSend,
}: AttachmentPreviewModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            styles.attachmentPreviewContainer,
            {
              opacity: animValue,
              backgroundColor: 'rgba(0,0,0,0.95)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.attachmentPreviewHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.attachmentPreviewCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.attachmentPreviewTitle}>
              {attachments.length} {attachments.length === 1 ? 'item' : 'items'} selected
            </Text>
            <TouchableOpacity
              onPress={onAddMore}
              style={styles.attachmentPreviewAddBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Preview Area */}
          <ScrollView
            style={styles.attachmentPreviewScroll}
            contentContainerStyle={styles.attachmentPreviewContent}
            horizontal={attachments.length > 1}
            pagingEnabled={attachments.length > 1}
            showsHorizontalScrollIndicator={attachments.length > 1}
          >
            {attachments.map((attachment, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.attachmentPreviewItem,
                  attachments.length > 1 && { width: SCREEN_WIDTH - 40 },
                  {
                    transform: [
                      {
                        scale: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {/* Remove button */}
                <TouchableOpacity
                  style={styles.attachmentRemoveBtn}
                  onPress={() => onRemove(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View style={styles.attachmentRemoveBtnInner}>
                    <Ionicons name="close" size={18} color="#fff" />
                  </View>
                </TouchableOpacity>

                {attachment.type === 'image' ? (
                  <Image
                    source={{ uri: attachment.uri }}
                    style={styles.attachmentPreviewImage}
                    resizeMode="contain"
                  />
                ) : attachment.type === 'video' ? (
                  <AttachmentVideoPreview uri={attachment.uri} duration={attachment.duration} />
                ) : (
                  <AttachmentFilePreview
                    name={attachment.name}
                    mimeType={attachment.mimeType}
                    primaryColor={colors.primary}
                  />
                )}

                {/* Index indicator for multiple attachments */}
                {attachments.length > 1 && (
                  <View style={styles.attachmentIndexBadge}>
                    <Text style={styles.attachmentIndexText}>
                      {index + 1}/{attachments.length}
                    </Text>
                  </View>
                )}
              </Animated.View>
            ))}
          </ScrollView>

          {/* Bottom: Caption input + Send button */}
          <View style={[styles.attachmentPreviewFooter, { backgroundColor: colors.surface }]}>
            <View
              style={[styles.attachmentCaptionContainer, { backgroundColor: colors.background }]}
            >
              <TextInput
                style={[styles.attachmentCaptionInput, { color: colors.text }]}
                placeholder="Add a caption..."
                placeholderTextColor={colors.textSecondary}
                value={caption}
                onChangeText={onCaptionChange}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity
              style={[styles.attachmentSendBtn, { backgroundColor: colors.primary }]}
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
}

// Sub-component for file preview
function AttachmentFilePreview({
  name,
  mimeType,
  primaryColor,
}: {
  name?: string;
  mimeType?: string;
  primaryColor: string;
}) {
  const getFileIcon = () => {
    if (mimeType?.includes('pdf')) return 'document-text';
    if (mimeType?.includes('word')) return 'document';
    if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return 'grid';
    return 'document-attach';
  };

  return (
    <View style={styles.attachmentPreviewFile}>
      <View style={[styles.attachmentPreviewFileIcon, { backgroundColor: primaryColor }]}>
        <Ionicons name={getFileIcon()} size={48} color="#fff" />
      </View>
      <Text style={styles.attachmentPreviewFileName} numberOfLines={2}>
        {name}
      </Text>
      <Text style={styles.attachmentPreviewFileType}>
        {mimeType?.split('/').pop()?.toUpperCase() || 'FILE'}
      </Text>
    </View>
  );
}

export default AttachmentPreviewModal;
