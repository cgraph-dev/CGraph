/**
 * Application Route Tree
 *
 * All route definitions organized by feature area:
 * dev/test, public, auth, and protected app routes.
 *
 * @module routes/AppRoutes
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';
import {
  ProtectedRoute,
  PublicRoute,
  AdminRoute,
  ProfileRedirectRoute,
  LandingRoute,
} from './guards';
import {
  // Auth
  Login,
  Register,
  ForgotPassword,
  OAuthCallback,
  Onboarding,
  ResetPassword,
  VerifyEmail,
  // Core
  Messages,
  Conversation,
  // Groups
  Groups,
  GroupChannel,
  // Forums
  Forums,
  ForumPost,
  ForumLeaderboard,
  CreateForum,
  CreatePost,
  ForumSettings,
  ForumBoardView,
  ForumAdmin,
  PluginMarketplace,
  ModerationQueue,
  // Settings
  Settings,
  ThemeCustomization,
  AppThemeSettings,
  TitleSelection,
  BadgeSelection,
  TwoFactorSetup,
  BlockedUsers,
  // Profile & Community
  UserProfile,
  UserLeaderboard,
  // Calls
  CallScreen,
  // Premium
  PremiumPage,
  CoinShop,
  // Hubs
  Customize,
  Social,
  // Members
  MemberList,
  WhosOnline,
  CalendarPage,
  ReferralPage,
  // Admin
  AdminDashboard,
  // Static
  NotFound,
  LandingPage,
  // Legal
  PrivacyPolicy,
  TermsOfService,
  CookiePolicy,
  GDPR,
  // Company
  About,
  Contact,
  Careers,
  Press,
  Status,
  Blog,
  Documentation,
  // Dev
  MatrixTest,
  EnhancedDemo,
  ThemeApplicationTest,
  LandingDemoWorkshop,
} from './lazyPages';

/** Complete application route tree */
export function AppRoutes() {
  return (
    <Routes>
      {/* ── Dev/Test routes ────────────────────────────────────────── */}
      <Route path="/test/matrix" element={<MatrixTest />} />
      <Route path="/test/enhanced" element={<EnhancedDemo />} />
      <Route path="/test/theme" element={<ThemeApplicationTest />} />
      <Route path="/demo/workshop" element={<LandingDemoWorkshop />} />

      {/* ── Landing (Discord-style) ───────────────────────────────── */}
      <Route
        path="/"
        element={
          <LandingRoute>
            <LandingPage />
          </LandingRoute>
        }
      />

      {/* ── Legal pages (public) ──────────────────────────────────── */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      <Route path="/gdpr" element={<GDPR />} />

      {/* ── Company pages (public) ────────────────────────────────── */}
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/press" element={<Press />} />
      <Route path="/status" element={<Status />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/docs" element={<Documentation />} />

      {/* ── Auth routes ───────────────────────────────────────────── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <AuthLayout>
              <ForgotPassword />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route path="/auth/oauth/:provider/callback" element={<OAuthCallback />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* ── Protected app routes ──────────────────────────────────── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Messages */}
        <Route path="messages" element={<Messages />}>
          <Route path=":conversationId" element={<Conversation />} />
        </Route>

        {/* Social Hub */}
        <Route path="social" element={<Navigate to="/social/friends" replace />} />
        <Route path="social/:tab" element={<Social />} />
        <Route path="friends" element={<Navigate to="/social/friends" replace />} />
        <Route path="notifications" element={<Navigate to="/social/notifications" replace />} />
        <Route path="search" element={<Navigate to="/social/discover" replace />} />

        {/* Groups */}
        <Route path="groups" element={<Groups />}>
          <Route path=":groupId/channels/:channelId" element={<GroupChannel />} />
        </Route>

        {/* Forums */}
        <Route
          path="forums"
          element={
            <RouteErrorBoundary routeName="Forums">
              <Forums />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/leaderboard"
          element={
            <RouteErrorBoundary routeName="Forum Leaderboard">
              <ForumLeaderboard />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/create"
          element={
            <RouteErrorBoundary routeName="Create Forum">
              <CreateForum />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/plugins"
          element={
            <RouteErrorBoundary routeName="Plugin Marketplace">
              <PluginMarketplace />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/moderation"
          element={
            <RouteErrorBoundary routeName="Moderation Queue">
              <ModerationQueue />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/:forumSlug"
          element={
            <RouteErrorBoundary routeName="Forum View">
              <ForumBoardView />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/:forumSlug/posts"
          element={
            <RouteErrorBoundary routeName="Forum Posts">
              <Forums />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/:forumSlug/create-post"
          element={
            <RouteErrorBoundary routeName="Create Post">
              <CreatePost />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/:forumSlug/settings"
          element={
            <RouteErrorBoundary routeName="Forum Settings">
              <ForumSettings />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/:forumSlug/admin"
          element={
            <RouteErrorBoundary routeName="Forum Admin">
              <ForumAdmin />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/:forumSlug/post/:postId"
          element={
            <RouteErrorBoundary routeName="Forum Post">
              <ForumPost />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/:forumSlug/boards/:boardSlug"
          element={
            <RouteErrorBoundary routeName="Forum Board">
              <ForumBoardView />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/:forumSlug/threads/:threadId"
          element={
            <RouteErrorBoundary routeName="Forum Thread">
              <ForumPost />
            </RouteErrorBoundary>
          }
        />
        <Route
          path="forums/:forumSlug/plugins"
          element={
            <RouteErrorBoundary routeName="Forum Plugins">
              <PluginMarketplace />
            </RouteErrorBoundary>
          }
        />

        {/* Settings */}
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

        {/* Community */}
        <Route path="community/leaderboard" element={<UserLeaderboard />} />

        {/* Members */}
        <Route path="members" element={<MemberList />} />
        <Route path="members/online" element={<WhosOnline />} />

        {/* Calendar */}
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="calendar/events" element={<CalendarPage />} />

        {/* Referrals */}
        <Route path="referrals" element={<ReferralPage />} />
        <Route path="referrals/history" element={<ReferralPage />} />

        {/* Premium */}
        <Route path="premium" element={<PremiumPage />} />
        <Route path="premium/coins" element={<CoinShop />} />

        {/* Customize Hub */}
        <Route path="customize" element={<Navigate to="/customize/identity" replace />} />
        <Route path="customize/:category" element={<Customize />} />

        {/* Profile */}
        <Route path="profile" element={<ProfileRedirectRoute />} />

        {/* Gamification redirects */}
        <Route path="leaderboard" element={<Navigate to="/customize/progression" replace />} />
        <Route path="gamification" element={<Navigate to="/customize/progression" replace />} />
        <Route
          path="gamification/achievements"
          element={<Navigate to="/customize/progression" replace />}
        />
        <Route
          path="gamification/quests"
          element={<Navigate to="/customize/progression" replace />}
        />
        <Route path="gamification/titles" element={<Navigate to="/customize/identity" replace />} />
        <Route path="achievements" element={<Navigate to="/customize/progression" replace />} />
        <Route path="quests" element={<Navigate to="/customize/progression" replace />} />
        <Route path="titles" element={<Navigate to="/customize/identity" replace />} />

        {/* Calls */}
        <Route path="call/:recipientId/:callType" element={<CallScreen />} />

        {/* Onboarding & User profile */}
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="user/:userId" element={<UserProfile />} />
        <Route path="u/:userId" element={<UserProfile />} />

        {/* Admin */}
        <Route
          path="admin/*"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
