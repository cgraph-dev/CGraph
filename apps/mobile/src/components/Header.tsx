import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  /** Header title */
  title: string;
  /** Subtitle */
  subtitle?: string;
  /** Show back button */
  showBack?: boolean;
  /** Back button handler */
  onBack?: () => void;
  /** Right side content */
  rightContent?: React.ReactNode;
  /** Left side content (replaces back button) */
  leftContent?: React.ReactNode;
  /** Large title style */
  largeTitle?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightContent,
  leftContent,
  largeTitle = false,
  style,
}: HeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {leftContent ? (
          <View style={styles.left}>{leftContent}</View>
        ) : showBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.titleContainer}>
          <Text
            style={[
              largeTitle ? styles.largeTitle : styles.title,
              { color: colors.text },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {rightContent ? (
          <View style={styles.right}>{rightContent}</View>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  left: {
    width: 40,
  },
  right: {
    width: 40,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 40,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
