import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import AccountScreen from '../screens/settings/AccountScreen';
import AppearanceScreen from '../screens/settings/AppearanceScreen';
import UICustomizationScreen from '../screens/settings/UICustomizationScreen';
import ChatBubbleSettingsScreen from '../screens/settings/ChatBubbleSettingsScreen';
import AvatarSettingsScreen from '../screens/settings/AvatarSettingsScreen';
import NotificationsScreen from '../screens/settings/NotificationsScreen';
import PrivacyScreen from '../screens/settings/PrivacyScreen';
import HolographicDemoScreen from '../screens/settings/HolographicDemoScreen';
import ProfileVisibilityScreen from '../screens/settings/ProfileVisibilityScreen';
import RSSFeedsScreen from '../screens/settings/RSSFeedsScreen';
import CustomEmojiScreen from '../screens/settings/CustomEmojiScreen';
import { PremiumScreen, CoinShopScreen } from '../screens/premium';
import { CalendarScreen } from '../screens/calendar';
import { LeaderboardScreen } from '../screens/leaderboard';
import { ReferralScreen } from '../screens/referrals';
import { MemberListScreen, WhosOnlineScreen } from '../screens/community';
import { E2EEVerificationScreen } from '../screens/security';
import { AdminDashboardScreen, ForumReorderScreen } from '../screens/admin';
import { ExportContentScreen } from '../screens/content';
import {
  GamificationHubScreen,
  AchievementsScreen,
  QuestsScreen,
  TitlesScreen,
} from '../screens/gamification';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsNavigator() {
  const { colors } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: 'Account' }}
      />
      <Stack.Screen
        name="Appearance"
        component={AppearanceScreen}
        options={{ title: 'Appearance' }}
      />
      <Stack.Screen
        name="UICustomization"
        component={UICustomizationScreen}
        options={{ title: 'UI Customization', headerShown: false }}
      />
      <Stack.Screen
        name="ChatBubbles"
        component={ChatBubbleSettingsScreen}
        options={{ title: 'Chat Bubbles', headerShown: false }}
      />
      <Stack.Screen
        name="AvatarSettings"
        component={AvatarSettingsScreen}
        options={{ title: 'Avatar Settings', headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ title: 'Privacy' }}
      />
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ title: 'CGraph Premium' }}
      />
      <Stack.Screen
        name="CoinShop"
        component={CoinShopScreen}
        options={{ title: 'Coin Shop' }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendar', headerShown: false }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard', headerShown: false }}
      />
      {/* Gamification Screens */}
      <Stack.Screen
        name="GamificationHub"
        component={GamificationHubScreen}
        options={{ title: 'Gamification', headerShown: false }}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: 'Achievements', headerShown: false }}
      />
      <Stack.Screen
        name="Quests"
        component={QuestsScreen}
        options={{ title: 'Quests', headerShown: false }}
      />
      <Stack.Screen
        name="Titles"
        component={TitlesScreen}
        options={{ title: 'Titles', headerShown: false }}
      />
      <Stack.Screen
        name="Referrals"
        component={ReferralScreen}
        options={{ title: 'Referral Program', headerShown: false }}
      />
      <Stack.Screen
        name="HolographicDemo"
        component={HolographicDemoScreen}
        options={{ title: 'Holographic UI', headerShown: false }}
      />
      {/* New screens */}
      <Stack.Screen
        name="ProfileVisibility"
        component={ProfileVisibilityScreen}
        options={{ title: 'Profile Visibility', headerShown: false }}
      />
      <Stack.Screen
        name="RSSFeeds"
        component={RSSFeedsScreen}
        options={{ title: 'RSS Feeds', headerShown: false }}
      />
      <Stack.Screen
        name="CustomEmoji"
        component={CustomEmojiScreen}
        options={{ title: 'Custom Emojis', headerShown: false }}
      />
      <Stack.Screen
        name="MemberList"
        component={MemberListScreen}
        options={{ title: 'Members', headerShown: false }}
      />
      <Stack.Screen
        name="WhosOnline"
        component={WhosOnlineScreen}
        options={{ title: "Who's Online", headerShown: false }}
      />
      <Stack.Screen
        name="E2EEVerification"
        component={E2EEVerificationScreen}
        options={{ title: 'Verify Security', headerShown: false }}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Admin Dashboard', headerShown: false }}
      />
      <Stack.Screen
        name="ForumReorder"
        component={ForumReorderScreen}
        options={{ title: 'Reorder Forums', headerShown: false }}
      />
      <Stack.Screen
        name="ExportContent"
        component={ExportContentScreen}
        options={{ title: 'Export', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
