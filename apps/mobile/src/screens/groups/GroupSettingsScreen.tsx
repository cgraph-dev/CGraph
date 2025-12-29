import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { GroupsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'GroupSettings'>;
  route: RouteProp<GroupsStackParamList, 'GroupSettings'>;
};

export default function GroupSettingsScreen({ navigation, route }: Props) {
  const { groupId: _groupId } = route.params;
  const { colors } = useTheme();
  
  const settingsItems = [
    {
      title: 'Overview',
      icon: 'information-circle-outline' as const,
      onPress: () => {},
    },
    {
      title: 'Roles',
      icon: 'shield-outline' as const,
      onPress: () => {},
    },
    {
      title: 'Channels',
      icon: 'list-outline' as const,
      onPress: () => {},
    },
    {
      title: 'Members',
      icon: 'people-outline' as const,
      onPress: () => {},
    },
    {
      title: 'Invites',
      icon: 'link-outline' as const,
      onPress: () => {},
    },
    {
      title: 'Moderation',
      icon: 'hammer-outline' as const,
      onPress: () => {},
    },
  ];
  
  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            // API call to leave group
            navigation.goBack();
          },
        },
      ]
    );
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={[
              styles.settingsItem,
              { backgroundColor: colors.surface },
              index === 0 && styles.firstItem,
              index === settingsItems.length - 1 && styles.lastItem,
            ]}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
            <Text style={[styles.settingsItemText, { color: colors.text }]}>
              {item.title}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: colors.surface }]}
          onPress={handleLeaveGroup}
        >
          <Ionicons name="exit-outline" size={22} color={colors.error} />
          <Text style={[styles.dangerButtonText, { color: colors.error }]}>
            Leave Group
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  firstItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
  },
  settingsItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});
