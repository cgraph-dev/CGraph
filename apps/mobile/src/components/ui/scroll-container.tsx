/**
 * ScrollContainer — enhanced ScrollView with pull-to-refresh support.
 * @module components/ui/scroll-container
 */
import React, { type ReactNode } from 'react';
import { ScrollView, RefreshControl, type ScrollViewProps, type ViewStyle } from 'react-native';

interface ScrollContainerProps extends Omit<ScrollViewProps, 'children'> {
  children: ReactNode;
  /** Enable pull-to-refresh */
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

/** Description. */
/** Scroll Container component. */
export function ScrollContainer({
  children,
  refreshing = false,
  onRefresh,
  style,
  contentStyle,
  ...props
}: ScrollContainerProps) {
  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      scrollIndicatorInsets={{ right: 1 }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="rgba(255,255,255,0.4)"
            colors={['#8b5cf6']}
            progressBackgroundColor="#1e2028"
          />
        ) : undefined
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export default ScrollContainer;
