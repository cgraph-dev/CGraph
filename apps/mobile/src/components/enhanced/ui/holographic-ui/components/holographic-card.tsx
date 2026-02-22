import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { HolographicConfig, getTheme } from '../types';
import { HolographicContainer } from './holographic-container';

interface HolographicCardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
  onPress?: () => void;
}

export function HolographicCard({
  children,
  header,
  footer,
  colorTheme = 'cyan',
  style,
  onPress,
}: HolographicCardProps) {
  const theme = getTheme(colorTheme);

  return (
    <HolographicContainer config={{ colorTheme }} style={style} onPress={onPress}>
      {/* Header */}
      {header && (
        <View
          style={[
            styles.cardSection,
            { borderBottomWidth: 1, borderBottomColor: `${theme.primary}40` },
          ]}
        >
          {header}
        </View>
      )}

      {/* Body */}
      <View style={styles.cardSection}>{children}</View>

      {/* Footer */}
      {footer && (
        <View
          style={[styles.cardSection, { borderTopWidth: 1, borderTopColor: `${theme.primary}40` }]}
        >
          {footer}
        </View>
      )}
    </HolographicContainer>
  );
}

const styles = StyleSheet.create({
  cardSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
