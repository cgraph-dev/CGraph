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
  // Profile & Community
  UserProfile,
  UserLeaderboard,
  // Calls
  CallScreen,
  CallHistory,
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

        {/* Forums */}
        {ForumRoutes()}

        {/* Settings */}
        {SettingsRoutes()}

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
