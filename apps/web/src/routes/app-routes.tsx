/**
 * Application Route Tree
 *
 * Composes route groups from modular sub-files for maintainability.
 * Each route group (dev, public, auth, forums, settings) is defined
 * in its own file under ./route-groups/.
 *
 * @module routes/AppRoutes
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { ProtectedRoute, AdminRoute, ProfileRedirectRoute } from './guards';
import { DevRoutes, AuthRoutes, ForumRoutes, SettingsRoutes } from './route-groups';
import {
  // Core
  Messages,
  Conversation,
  Onboarding,
  // Groups
  Groups,
  GroupChannel,
  ExploreGroups,
  // Explore (unified)
  ExplorePage,
  // Discovery (Phase 31)
  FeedPage,
  DiscoverySettings,
  // Profile & Community
  UserProfile,
  // Calls
  CallScreen,
  CallHistory,
  // Premium
  PremiumPage,
  // Creator
  CreatorDashboard,
  CreatorEarnings,
  CreatorPayouts,
  CreatorAnalytics,
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
} from './lazyPages';

/** Complete application route tree */
export function AppRoutes() {
  return (
    <Routes>
      {/* ── Dev/Test ───────────────────────────────────────────────── */}
      {DevRoutes()}

      {/* ── Auth routes ───────────────────────────────────────────── */}
      {AuthRoutes()}

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
        <Route path="groups/explore" element={<ExploreGroups />} />

        {/* Explore — unified community discovery */}
        <Route path="explore" element={<ExplorePage />} />

        {/* Discovery Feed (Phase 31) */}
        <Route path="feed" element={<FeedPage />} />

        {/* Forums */}
        {ForumRoutes()}

        {/* Settings */}
        {SettingsRoutes()}

        {/* Discovery Settings (Phase 31) */}
        <Route path="settings/discovery" element={<DiscoverySettings />} />

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

        {/* Creator */}
        <Route path="creator" element={<CreatorDashboard />} />
        <Route path="creator/earnings" element={<CreatorEarnings />} />
        <Route path="creator/payouts" element={<CreatorPayouts />} />
        <Route path="creator/analytics" element={<CreatorAnalytics />} />

        {/* Customize Hub */}
        <Route path="customize" element={<Navigate to="/customize/identity" replace />} />
        <Route path="customize/:category" element={<Customize />} />

        {/* Profile */}
        <Route path="profile" element={<ProfileRedirectRoute />} />

        {/* Gamification catchall — deleted pages redirect home */}
        <Route path="gamification/*" element={<Navigate to="/" replace />} />
        <Route path="leaderboard" element={<Navigate to="/" replace />} />
        <Route path="achievements" element={<Navigate to="/" replace />} />
        <Route path="quests" element={<Navigate to="/" replace />} />
        <Route path="titles" element={<Navigate to="/customize/identity" replace />} />

        {/* Calls */}
        <Route path="call/:recipientId/:callType" element={<CallScreen />} />
        <Route path="calls/history" element={<CallHistory />} />

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
