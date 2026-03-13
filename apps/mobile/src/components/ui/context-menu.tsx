/**
 * ContextMenu — long-press activated menu with haptic feedback for mobile.
 * @module components/ui/context-menu
 */
import React, { type ReactNode, useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  type GestureResponderEvent,
  type ViewStyle,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { radius, zIndex } from '@/theme/tokens';

interface ContextMenuProps {
  children: ReactNode;
  items: ContextMenuItem[];
  style?: ViewStyle;
}

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  /** 'separator' renders a divider line */
  type?: 'item' | 'separator';
}

/** Description. */
/** Context Menu component. */
export function ContextMenu({ children, items, style }: ContextMenuProps) {
  const [visible, setVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  const openMenu = useCallback(
    (e: GestureResponderEvent) => {
      const { pageX, pageY } = e.nativeEvent;
      const { width, height } = Dimensions.get('window');
      // Position menu near press point, clamped to screen
      const x = Math.min(pageX, width - 200);
      const y = Math.min(pageY, height - items.length * 44 - 20);
      setMenuPos({ x, y });
      setVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 150 });
    },
    [items.length, scale, opacity]
  );

  const closeMenu = useCallback(() => {
    opacity.value = withTiming(0, { duration: 100 });
    scale.value = withTiming(0.8, { duration: 100 }, () => {
      runOnJS(setVisible)(false);
    });
  }, [scale, opacity]);

  const menuStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <>
      <Pressable onLongPress={openMenu} delayLongPress={400} style={style}>
        {children}
      </Pressable>

      <Modal visible={visible} transparent animationType="none" onRequestClose={closeMenu}>
        <Pressable style={styles.backdrop} onPress={closeMenu}>
          <Animated.View style={[styles.menu, { left: menuPos.x, top: menuPos.y }, menuStyle]}>
            {items.map((item, i) => {
              if (item.type === 'separator') {
                return <View key={i} style={styles.separator} />;
              }
              return (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                    item.disabled && styles.menuItemDisabled,
                  ]}
                  disabled={item.disabled}
                  onPress={() => {
                    closeMenu();
                    item.onPress();
                  }}
                >
                  {item.icon && <View style={styles.iconBox}>{item.icon}</View>}
                  <Text
                    style={[
                      styles.menuText,
                      item.destructive && styles.destructiveText,
                      item.disabled && styles.disabledText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    minWidth: 180,
    maxWidth: 280,
    backgroundColor: 'rgba(18,18,24,0.95)',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 4,
    zIndex: zIndex.popover,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderRadius: radius.md,
    marginHorizontal: 4,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(139,92,246,0.25)',
  },
  menuItemDisabled: {
    opacity: 0.4,
  },
  iconBox: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  destructiveText: {
    color: '#f87171',
  },
  disabledText: {
    color: 'rgba(255,255,255,0.3)',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 4,
  },
});

export default ContextMenu;
