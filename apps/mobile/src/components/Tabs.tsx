import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type TabItem = {
  id: string;
  label: string;
  badge?: number;
  icon?: React.ReactNode;
};

type TabsProps = {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'pill' | 'underline';
  style?: StyleProp<ViewStyle>;
};

export default function Tabs({
  items,
  activeTab,
  onTabChange,
  variant = 'pill',
  style,
}: TabsProps) {
  const { colors } = useTheme();

  if (variant === 'underline') {
    return (
      <View style={[styles.underlineContainer, { borderBottomColor: colors.border }, style]}>
        {items.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.underlineTab,
                isActive && { borderBottomColor: colors.primary },
              ]}
              onPress={() => onTabChange(item.id)}
            >
              {item.icon && <View style={styles.tabIcon}>{item.icon}</View>}
              <Text
                style={[
                  styles.underlineTabText,
                  { color: isActive ? colors.primary : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
              {item.badge !== undefined && item.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.pillContainer, style]}>
      {items.map((item) => {
        const isActive = item.id === activeTab;
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.pillTab,
              isActive && { backgroundColor: colors.primary },
            ]}
            onPress={() => onTabChange(item.id)}
          >
            {item.icon && <View style={styles.tabIcon}>{item.icon}</View>}
            <Text
              style={[
                styles.pillTabText,
                { color: isActive ? '#fff' : colors.textSecondary },
              ]}
            >
              {item.label}
            </Text>
            {item.badge !== undefined && item.badge > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isActive ? '#fff' : colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isActive ? colors.primary : '#fff' },
                  ]}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  pillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pillTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  underlineContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  underlineTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  underlineTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabIcon: {
    marginRight: 2,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
