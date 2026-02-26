import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ThemeColors } from '@/stores';
import { UserBasic, FriendsStackParamList } from '../../../types';

export type NavigationProp = NativeStackNavigationProp<FriendsStackParamList>;

export interface FriendItem {
  id: string;
  user: UserBasic;
}

export type { ThemeColors, UserBasic };
