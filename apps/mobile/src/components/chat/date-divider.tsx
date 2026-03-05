/**
 * DateDivider — centered day separator between message groups.
 * @module components/chat/date-divider
 */
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { space } from '../../theme/tokens';

interface DateDividerProps {
  date: string | Date;
}

/**
 * DateDivider — centered pill with date label, thin separator lines.
 */
export const DateDivider = memo(function DateDivider({ date }: DateDividerProps) {
  const label =
    typeof date === 'string' && !date.includes('T')
      ? date
      : formatDayLabel(typeof date === 'string' ? new Date(date) : date);

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.pill}>
        <Text style={styles.text}>{label}</Text>
      </View>
      <View style={styles.line} />
    </View>
  );
});

function formatDayLabel(d: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - target.getTime();
  const dayMs = 86_400_000;

  if (diff < dayMs) return 'Today';
  if (diff < dayMs * 2) return 'Yesterday';

  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    gap: space[3],
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pill: {
    paddingHorizontal: space[2],
    paddingVertical: space[0.5],
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
});

export default DateDivider;
