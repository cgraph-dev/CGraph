/**
 * Settings route definitions (protected)
 *
 * @module routes/routeGroups/settingsRoutes
 */

import { Route } from 'react-router-dom';
import { RouteErrorBoundary } from '@/components/feedback/route-error-boundary';
import {
  Settings,
  ThemeCustomization,
  AppThemeSettings,
  TitleSelection,
  BadgeSelection,
  TwoFactorSetup,
  BlockedUsers,
  CustomEmoji,
  RSSFeeds,
  E2EEVerification,
  KeyVerification,
} from '../lazyPages';

/** All settings-related protected routes */
export function SettingsRoutes() {
  return (
    <>
      <Route
        path="settings"
        element={
          <RouteErrorBoundary routeName="Settings">
            <Settings />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/:section"
        element={
          <RouteErrorBoundary routeName="Settings">
            <Settings />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/theme"
        element={
          <RouteErrorBoundary routeName="Theme Customization">
            <ThemeCustomization />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/app-theme"
        element={
          <RouteErrorBoundary routeName="App Theme">
            <AppThemeSettings />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/titles"
        element={
          <RouteErrorBoundary routeName="Title Selection">
            <TitleSelection />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/badges"
        element={
          <RouteErrorBoundary routeName="Badge Selection">
            <BadgeSelection />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/security/2fa-setup"
        element={
          <RouteErrorBoundary routeName="2FA Setup">
            <TwoFactorSetup />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/privacy/blocked"
        element={
          <RouteErrorBoundary routeName="Blocked Users">
            <BlockedUsers />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/custom-emoji"
        element={
          <RouteErrorBoundary routeName="Custom Emoji">
            <CustomEmoji />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/rss-feeds"
        element={
          <RouteErrorBoundary routeName="RSS Feeds">
            <RSSFeeds />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/security/e2ee/:userId"
        element={
          <RouteErrorBoundary routeName="E2EE Verification">
            <E2EEVerification />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="settings/security/verify-key/:userId"
        element={
          <RouteErrorBoundary routeName="Key Verification">
            <KeyVerification />
          </RouteErrorBoundary>
        }
      />
    </>
  );
}
