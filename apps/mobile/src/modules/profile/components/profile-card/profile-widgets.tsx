/**
 * ProfileWidgets — widget row for profile cards.
 *
 * Renders up to 4 widget slots with icons and labels.
 * Shows an "Add Widgets" empty state when no widgets are configured.
 *
 * @module profile/components/ProfileCard/ProfileWidgets
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Widget data shape */
export interface ProfileWidget {
  id: string;
  type: string;
  label: string;
  icon: string;
  value?: string;
}

interface ProfileWidgetsProps {
  /** Array of widget configs (max 4 displayed) */
  widgets: ProfileWidget[];
  /** Handler when a widget slot is tapped */
  onPressWidget?: (widget: ProfileWidget) => void;
  /** Handler for the "Add Widgets" button */
  onPressAdd?: () => void;
}

/** Map widget icon strings to Ionicons names */
function getIconName(icon: string): string {
  const iconMap: Record<string, string> = {
    discord: 'logo-discord',
    twitter: 'logo-twitter',
    github: 'logo-github',
    steam: 'game-controller',
    spotify: 'musical-notes',
    status: 'chatbubble',
    stats: 'stats-chart',
    time: 'time',
    calendar: 'calendar',
  };
  return iconMap[icon] ?? 'apps';
}

/**
 * Renders a row of profile widgets or an empty state prompt.
 */
export function ProfileWidgets({ widgets, onPressWidget, onPressAdd }: ProfileWidgetsProps) {
  if (widgets.length === 0) {
    return (
      <TouchableOpacity style={styles.emptyState} onPress={onPressAdd}>
        <Ionicons name="add-circle-outline" size={24} color="#888" />
        <Text style={styles.emptyText}>Add Widgets</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.row}>
      {widgets.slice(0, 4).map((widget) => (
        <TouchableOpacity
          key={widget.id}
          style={styles.widget}
          onPress={() => onPressWidget?.(widget)}
        >
          <Ionicons
             
            name={getIconName(widget.icon) as React.ComponentProps<typeof Ionicons>['name']}
            size={20}
            color="#aaa"
          />
          <Text style={styles.widgetLabel} numberOfLines={1}>
            {widget.label}
          </Text>
          {widget.value && (
            <Text style={styles.widgetValue} numberOfLines={1}>
              {widget.value}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  widget: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 72,
  },
  widgetLabel: {
    fontSize: 11,
    color: '#ccc',
    fontWeight: '500',
  },
  widgetValue: {
    fontSize: 10,
    color: '#888',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
});
