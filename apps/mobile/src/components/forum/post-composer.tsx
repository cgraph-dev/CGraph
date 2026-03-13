/**
 * Post Composer (Mobile) — Full-screen thread creation modal
 *
 * Features:
 * - Full-screen modal
 * - Simplified toolbar (bold, italic, code, image, mention)
 * - Preview toggle (no side-by-side)
 * - Poll creation
 * - Submit from header right button
 *
 * @module components/forum/post-composer
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ── Types ──────────────────────────────────────────────────────────────

interface PostComposerProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: { title: string; content: string }) => void;
}

// ── Toolbar Button ─────────────────────────────────────────────────────

function ToolBtn({
  icon,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.toolBtn}
    >
      <MaterialCommunityIcons name={icon} size={20} color="rgba(255,255,255,0.5)" />
    </Pressable>
  );
}

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Post Composer component. */
export function PostComposer({
  visible,
  onClose,
  onSubmit,
}: PostComposerProps): React.ReactElement | null {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const MAX_TITLE = 120;

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !content.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit?.({ title: title.trim(), content: content.trim() });
    setTitle('');
    setContent('');
    onClose();
  }, [title, content, onSubmit, onClose]);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <Animated.View entering={SlideInUp.duration(300)} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>New Thread</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.headerBtn, !canSubmit && styles.headerBtnDisabled]}
          >
            <Text style={[styles.postText, !canSubmit && styles.postTextDisabled]}>Post</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.body}
        >
          <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
            {/* Title input */}
            <TextInput
              value={title}
              onChangeText={(t) => setTitle(t.slice(0, MAX_TITLE))}
              placeholder="Thread title..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={styles.titleInput}
              maxLength={MAX_TITLE}
            />
            <Text style={styles.charCount}>
              {title.length}/{MAX_TITLE}
            </Text>

            {/* Content */}
            {showPreview ? (
              <Animated.View entering={FadeIn.duration(200)} style={styles.previewArea}>
                <Text style={styles.previewText}>{content || 'Nothing to preview'}</Text>
              </Animated.View>
            ) : (
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Write your thread content..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={styles.contentInput}
                multiline
                textAlignVertical="top"
              />
            )}
          </ScrollView>

          {/* Toolbar */}
          <View style={styles.toolbar}>
            <ToolBtn icon="format-bold" onPress={() => {}} />
            <ToolBtn icon="format-italic" onPress={() => {}} />
            <ToolBtn icon="code-tags" onPress={() => {}} />
            <ToolBtn icon="image-outline" onPress={() => {}} />
            <ToolBtn icon="at" onPress={() => {}} />
            <View style={styles.toolbarSpacer} />
            <Pressable
              onPress={() => setShowPreview((p) => !p)}
              style={[styles.previewToggle, showPreview && styles.previewToggleActive]}
            >
              <MaterialCommunityIcons
                name={showPreview ? 'pencil' : 'eye'}
                size={16}
                color={showPreview ? '#6366f1' : 'rgba(255,255,255,0.5)'}
              />
              <Text
                style={[styles.previewToggleText, showPreview && styles.previewToggleTextActive]}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1b1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerBtnDisabled: {
    opacity: 0.4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  postText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366f1',
  },
  postTextDisabled: {
    color: 'rgba(99, 102, 241, 0.4)',
  },
  body: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 8,
  },
  charCount: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.2)',
    textAlign: 'right',
    marginBottom: 8,
  },
  contentInput: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    minHeight: 200,
    paddingTop: 8,
  },
  previewArea: {
    paddingTop: 8,
    minHeight: 200,
  },
  previewText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 22,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#1a1b1e',
  },
  toolBtn: {
    padding: 8,
    borderRadius: 8,
  },
  toolbarSpacer: {
    flex: 1,
  },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewToggleActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  previewToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  previewToggleTextActive: {
    color: '#6366f1',
  },
});

export default PostComposer;
