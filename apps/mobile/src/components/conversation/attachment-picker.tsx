/**
 * AttachmentPicker Component
 * 
 * Bottom sheet with options for attaching media to messages.
 * Provides quick access to camera, gallery, and file picker.
 * 
 * @module components/conversation/AttachmentPicker
 * @since v0.7.29
 */

import React, { memo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AttachmentType = 'camera' | 'gallery' | 'file';

export interface AttachmentPickerProps {
  /** Whether the picker is visible */
  visible: boolean;
  /** Background color for the sheet */
  backgroundColor: string;
  /** Text color for labels */
  textColor: string;
  /** Muted text color for secondary labels */
  mutedColor: string;
  /** Primary accent color */
  accentColor: string;
  /** Callback when an option is selected */
  onSelect: (type: AttachmentType) => void;
  /** Callback to close the picker */
  onClose: () => void;
}

interface AttachmentOption {
  type: AttachmentType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  color: string;
}

const ATTACHMENT_OPTIONS: AttachmentOption[] = [
  {
    type: 'camera',
    icon: 'camera',
    label: 'Camera',
    description: 'Take a photo or video',
    color: '#f43f5e',
  },
  {
    type: 'gallery',
    icon: 'images',
    label: 'Gallery',
    description: 'Choose from library',
    color: '#8b5cf6',
  },
  {
    type: 'file',
    icon: 'document',
    label: 'File',
    description: 'Share a document',
    color: '#3b82f6',
  },
];

/**
 * Attachment picker bottom sheet.
 * 
 * Features:
 * - Slide-up animation from bottom
 * - Three options: Camera, Gallery, File
 * - Visual icons with descriptions
 * - Tap backdrop to dismiss
 * - Accessible with proper labels
 * 
 * @example
 * ```tsx
 * <AttachmentPicker
 *   visible={showPicker}
 *   backgroundColor="#1a1a2e"
 *   textColor="#fff"
 *   mutedColor="#a5a5b5"
 *   accentColor="#818cf8"
 *   onSelect={handleAttachment}
 *   onClose={() => setShowPicker(false)}
 * />
 * ```
 */
export const AttachmentPicker = memo(function AttachmentPicker({
  visible,
  backgroundColor,
  textColor,
  mutedColor,
  accentColor,
  onSelect,
  onClose,
}: AttachmentPickerProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleSelect = useCallback(
    (type: AttachmentType) => {
      onSelect(type);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Bottom sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle indicator */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: mutedColor }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              Add Attachment
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={mutedColor} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.options}>
            {ATTACHMENT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={styles.option}
                onPress={() => handleSelect(option.type)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${option.label}: ${option.description}`}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                  <Ionicons name={option.icon} size={26} color={option.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: textColor }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: mutedColor }]}>
                    {option.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={mutedColor} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel button */}
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: mutedColor + '30' }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: mutedColor }]}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  options: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttachmentPicker;
