import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';

interface EmptyStateProps {
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Custom icon component */
  iconComponent?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button text */
  actionText?: string;
  /** Action button handler */
  onAction?: () => void;
  /** Additional styles */
  style?: ViewStyle;
}

export default function EmptyState({
  icon,
  iconComponent,
  title,
  description,
  actionText,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {iconComponent ? (
        iconComponent
      ) : icon ? (
        <Ionicons name={icon} size={64} color={colors.textSecondary} />
      ) : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}
      {actionText && onAction && (
        <Button onPress={onAction} style={styles.button}>
          {actionText}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
  },
  button: {
    marginTop: 24,
  },
});
