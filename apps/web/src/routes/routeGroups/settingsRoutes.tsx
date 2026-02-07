/**
 * Settings route definitions (protected)
 *
 * @module routes/routeGroups/settingsRoutes
 */

import { Route } from 'react-router-dom';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import {
  Settings,
  ThemeCustomization,
  AppThemeSettings,
  TitleSelection,
  BadgeSelection,
  TwoFactorSetup,
  BlockedUsers,
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
    </>
  );
}
