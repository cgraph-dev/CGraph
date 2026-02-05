/**
 * GroupListScreen Types
 */

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupsStackParamList, Group } from '../../../types';
import { ThemeColors } from '../../../contexts/ThemeContext';

export type GroupListScreenProps = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupList'>;
};

export interface MorphingGroupCardProps {
  item: Group;
  index: number;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
}

export interface AnimatedHeaderProps {
  colors: ThemeColors;
  onCreatePress: () => void;
}

export interface MemberAvatarStackProps {
  memberCount: number;
  colors: ThemeColors;
}

export interface FloatingParticlesProps {
  isActive: boolean;
}

export { Group };
