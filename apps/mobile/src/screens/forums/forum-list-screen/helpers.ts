import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '@/stores';
import { ForumsStackParamList, Forum } from '../../../types';

export type ForumListProps = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumList'>;
};

export type ForumColors = ReturnType<typeof useThemeStore>['colors'];

export function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function getMockForums(): Forum[] {
  return [
    {
      id: '1', name: 'Technology', slug: 'technology',
      description: 'Discuss the latest in tech',
      member_count: 15420, post_count: 8934, icon_url: '',
      is_public: true, flairs: [], inserted_at: new Date().toISOString(),
    },
    {
      id: '2', name: 'Gaming', slug: 'gaming',
      description: 'All about video games',
      member_count: 28500, post_count: 12500, icon_url: '',
      is_public: true, flairs: [], inserted_at: new Date().toISOString(),
    },
    {
      id: '3', name: 'Programming', slug: 'programming',
      description: 'Code discussions and help',
      member_count: 9800, post_count: 4500, icon_url: '',
      is_public: true, flairs: [], inserted_at: new Date().toISOString(),
    },
    {
      id: '4', name: 'Design', slug: 'design',
      description: 'UI/UX and graphic design',
      member_count: 5600, post_count: 2300, icon_url: '',
      is_public: true, flairs: [], inserted_at: new Date().toISOString(),
    },
    {
      id: '5', name: 'Music', slug: 'music',
      description: 'Share and discover music',
      member_count: 12300, post_count: 6700, icon_url: '',
      is_public: true, flairs: [], inserted_at: new Date().toISOString(),
    },
  ];
}

export type { Forum };
