/**
 * Stack navigator for the settings section with all settings screens.
 * @module navigation/settings-navigator
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../types';
import { useThemeStore } from '@/stores';
import SettingsScreen from '../screens/settings/settings-screen';
import ProfileScreen from '../screens/settings/profile-screen';
import AccountScreen from '../screens/settings/account-screen';
import AppearanceScreen from '../screens/settings/appearance-screen';
import UICustomizationScreen from '../screens/settings/ui-customization-screen';
import ChatBubbleSettingsScreen from '../screens/settings/chat-bubble-settings-screen';
import AvatarSettingsScreen from '../screens/settings/avatar-settings-screen';
import NotificationsScreen from '../screens/settings/notifications-screen';
import PrivacyScreen from '../screens/settings/privacy-screen';
import HolographicDemoScreen from '../screens/settings/holographic-demo-screen';
import ProfileVisibilityScreen from '../screens/settings/profile-visibility-screen';
import RSSFeedsScreen from '../screens/settings/rss-feeds-screen';
import CustomEmojiScreen from '../screens/settings/custom-emoji/custom-emoji-screen';
import { PremiumScreen, CoinShopScreen } from '../screens/premium';
import { CalendarScreen } from '../screens/calendar';
// TODO(phase-26): Rewire — LeaderboardScreen deleted (../screens/leaderboard)
import { ReferralScreen } from '../screens/referrals';
import { MemberListScreen, WhosOnlineScreen } from '../screens/community';
import { E2EEVerificationScreen } from '../screens/security';
import { AdminDashboardScreen, ForumReorderScreen } from '../screens/admin';
import { ExportContentScreen } from '../screens/content';
import {
  CustomizeScreen,
  IdentityCustomizationScreen,
  EffectsCustomizationScreen,
  BadgeSelectionScreen,
  TitleSelectionScreen,
} from '../screens/customize';
import EmailNotificationsScreen from '../screens/settings/email-notifications-screen';
import KeyVerificationScreen from '../screens/settings/key-verification-screen';
import ProfileCustomizationScreen from '../screens/profile/ProfileCustomizationScreen';
import PrivacyPolicyScreen from '../screens/legal/privacy-policy-screen';
import TermsOfServiceScreen from '../screens/legal/terms-of-service-screen';
import CookiePolicyScreen from '../screens/legal/cookie-policy-screen';
import GDPRScreen from '../screens/legal/gdpr-screen';
import SessionsScreen from '../screens/settings/sessions-screen';
// TODO(phase-26): Rewire — gamification components deleted
import CustomStatusScreen from '../screens/social/custom-status-screen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

/** Settings stack navigator — gamification screens removed (phase-26). */
export default function SettingsNavigator() {
  const { colors } = useThemeStore();

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
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
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
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy' }} />
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ title: 'CGraph Premium' }}
      />
      <Stack.Screen name="CoinShop" component={CoinShopScreen} options={{ title: 'Coin Shop' }} />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendar', headerShown: false }}
      />
      {/* TODO(phase-26): Rewire — Leaderboard screen removed, reintroduce when rebuilt */}
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
      {/* Customize Hub Screens */}
      <Stack.Screen
        name="Customize"
        component={CustomizeScreen}
        options={{ title: 'Customize', headerShown: false }}
      />
      <Stack.Screen
        name="IdentityCustomization"
        component={IdentityCustomizationScreen}
        options={{ title: 'Identity', headerShown: false }}
      />
      <Stack.Screen
        name="EffectsCustomization"
        component={EffectsCustomizationScreen}
        options={{ title: 'Effects & Themes', headerShown: false }}
      />
      {/* TODO(phase-26): Rewire — gamification components deleted (ProgressionCustomization) */}
      <Stack.Screen
        name="ProfileCustomization"
        component={ProfileCustomizationScreen}
        options={{ title: 'Profile Cosmetics', headerShown: false }}
      />
      <Stack.Screen
        name="BadgeSelection"
        component={BadgeSelectionScreen}
        options={{ title: 'Badges', headerShown: false }}
      />
      <Stack.Screen
        name="TitleSelection"
        component={TitleSelectionScreen}
        options={{ title: 'Titles', headerShown: false }}
      />
      <Stack.Screen
        name="KeyVerification"
        component={KeyVerificationScreen}
        options={{ title: 'Key Verification', headerShown: false }}
      />
      <Stack.Screen
        name="EmailNotifications"
        component={EmailNotificationsScreen}
        options={{ title: 'Email Notifications', headerShown: false }}
      />
      {/* Legal Screens */}
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Privacy Policy' }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ title: 'Terms of Service' }}
      />
      <Stack.Screen
        name="CookiePolicy"
        component={CookiePolicyScreen}
        options={{ title: 'Cookie Policy' }}
      />
      <Stack.Screen name="GDPR" component={GDPRScreen} options={{ title: 'GDPR Information' }} />
      <Stack.Screen
        name="Sessions"
        component={SessionsScreen}
        options={{ title: 'Active Sessions', headerShown: false }}
      />
      <Stack.Screen
        name="CustomStatus"
        component={CustomStatusScreen}
        options={{ title: 'Custom Status', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
