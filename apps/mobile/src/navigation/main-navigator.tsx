/**
 * Main tab navigator with bottom tab bar for primary app sections.
 * @module navigation/main-navigator
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { useThemeStore } from '@/stores';
import { AnimatedTabBar } from './components/animated-tab-bar';
import MessagesNavigator from './messages-navigator';
import FriendsNavigator from './friends-navigator';
import NotificationsNavigator from './notifications-navigator';
import SearchNavigator from './search-navigator';
import GroupsNavigator from './groups-navigator';
import ForumsNavigator from './forums-navigator';
import SettingsNavigator from './settings-navigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  const { colors } = useThemeStore();
  
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          switch (route.name) {
            case 'MessagesTab':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'FriendsTab':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'NotificationsTab':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'SearchTab':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'GroupsTab':
              iconName = focused ? 'globe' : 'globe-outline';
              break;
            case 'ForumsTab':
              iconName = focused ? 'newspaper' : 'newspaper-outline';
              break;
            case 'SettingsTab':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="MessagesTab"
        component={MessagesNavigator}
        options={{ tabBarLabel: 'Messages' }}
      />
      <Tab.Screen
        name="FriendsTab"
        component={FriendsNavigator}
        options={{ tabBarLabel: 'Friends' }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsNavigator}
        options={{ tabBarLabel: 'Alerts' }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchNavigator}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="GroupsTab"
        component={GroupsNavigator}
        options={{ tabBarLabel: 'Groups' }}
      />
      <Tab.Screen
        name="ForumsTab"
        component={ForumsNavigator}
        options={{ tabBarLabel: 'Forums' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
