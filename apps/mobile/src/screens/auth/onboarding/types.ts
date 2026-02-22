/**
 * Onboarding Screen - Types & Constants
 *
 * @version 1.0.0
 */

import { Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../types';

export const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type OnboardingProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
};

export interface NotificationSettings {
  messages: boolean;
  mentions: boolean;
  friendRequests: boolean;
}

export const STEPS = [
  { id: 1, title: 'Welcome', icon: '👋' },
  { id: 2, title: 'Profile', icon: '👤' },
  { id: 3, title: 'Notifications', icon: '🔔' },
  { id: 4, title: 'Ready', icon: '🚀' },
];

export const FEATURES = [
  { icon: '💬', title: 'Encrypted Chat', desc: 'End-to-end encryption' },
  { icon: '👥', title: 'Groups', desc: 'Create communities' },
  { icon: '📋', title: 'Forums', desc: 'Forum-style discussions' },
  { icon: '🏆', title: 'Gamification', desc: 'Earn XP & achievements' },
  { icon: '📞', title: 'Calls', desc: 'Voice & video calling' },
  { icon: '🎨', title: 'Themes', desc: 'Customize your look' },
];
