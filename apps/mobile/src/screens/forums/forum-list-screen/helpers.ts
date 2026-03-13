import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ThemeColors } from '@/stores';
import { ForumsStackParamList, Forum } from '../../../types';

export type ForumListProps = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumList'>;
};

export type ForumColors = ThemeColors;

/** Description. */
/** Formats count. */
export function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export type { Forum };
