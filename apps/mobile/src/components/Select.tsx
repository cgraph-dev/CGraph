import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

type SelectOption = {
  value: string;
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
};

type SelectProps = {
  options: SelectOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function Select({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option...',
  searchable = false,
  label,
  error,
  disabled = false,
  style,
}: SelectProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View style={style}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.error : colors.border,
          },
          disabled && styles.disabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        activeOpacity={0.7}
      >
        {selectedOption?.icon && (
          <Ionicons
            name={selectedOption.icon}
            size={20}
            color={colors.textSecondary}
            style={styles.triggerIcon}
          />
        )}
        <Text
          style={[
            styles.triggerText,
            { color: selectedOption ? colors.text : colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.dropdown,
              { backgroundColor: colors.surface },
            ]}
          >
            {searchable && (
              <View
                style={[
                  styles.searchContainer,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                />
              </View>
            )}
            
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && {
                      backgroundColor: colors.primary + '20',
                    },
                    item.disabled && styles.optionDisabled,
                  ]}
                  onPress={() => !item.disabled && handleSelect(item.value)}
                  activeOpacity={0.7}
                >
                  {item.icon && (
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={
                        item.value === value
                          ? colors.primary
                          : colors.textSecondary
                      }
                      style={styles.optionIcon}
                    />
                  )}
                  <View style={styles.optionText}>
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: item.disabled
                            ? colors.textSecondary
                            : item.value === value
                            ? colors.primary
                            : colors.text,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.description && (
                      <Text
                        style={[
                          styles.optionDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.description}
                      </Text>
                    )}
                  </View>
                  {item.value === value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={{ color: colors.textSecondary }}>
                    No options found
                  </Text>
                </View>
              }
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  triggerIcon: {
    marginRight: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdown: {
    width: '100%',
    maxHeight: 400,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
});
