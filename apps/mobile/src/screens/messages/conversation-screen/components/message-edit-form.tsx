/**
 * MessageEditForm Component
 *
 * Inline editing form that replaces message content when editing.
 * Pre-populated with current content. Save calls editMessage, Cancel restores view.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageEditFormProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    surface: string;
    input: string;
  };
}

/**
 * Inline form for editing a message, rendered in place of the message content.
 */
export function MessageEditForm({
  initialContent,
  onSave,
  onCancel,
  colors,
}: MessageEditFormProps) {
  const [content, setContent] = useState(initialContent);

  const handleSave = () => {
    const trimmed = content.trim();
    if (trimmed && trimmed !== initialContent) {
      onSave(trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <View style={editStyles.container}>
      <TextInput
        style={[
          editStyles.input,
          {
            color: colors.text,
            backgroundColor: colors.input,
            borderColor: colors.primary + '40',
          },
        ]}
        value={content}
        onChangeText={setContent}
        multiline
        autoFocus
        placeholder="Edit message..."
        placeholderTextColor={colors.textSecondary}
      />
      <View style={editStyles.actions}>
        <TouchableOpacity
          onPress={onCancel}
          style={[editStyles.button, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={16} color={colors.textSecondary} />
          <Text style={[editStyles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          style={[editStyles.button, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={[editStyles.buttonText, { color: '#fff' }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const editStyles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    lineHeight: 21,
    maxHeight: 120,
    minHeight: 40,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
