/**
 * ConversationSearch — search bar for filtering conversations.
 * @module components/conversation/conversation-search
 */
import React, { memo, useState, useCallback } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { space, radius } from '../../theme/tokens';

interface ConversationSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/**
 * Search input with clear button and cancel action.
 */
export const ConversationSearch = memo(function ConversationSearch({
  value,
  onChangeText,
  placeholder = 'Search conversations...',
}: ConversationSearchProps) {
  const [focused, setFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: space[2.5],
    height: 36,
  },
  inputWrapFocused: {
    borderColor: 'rgba(124,58,237,0.4)',
  },
  searchIcon: {
    fontSize: 12,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    padding: 0,
  },
  clearButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  clearText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
});

export default ConversationSearch;
