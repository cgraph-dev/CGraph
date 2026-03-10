/**
 * Lazy Page Imports
 *
 * Code-split page declarations for smaller initial bundle size.
 * Reduces initial JS from ~500KB to ~150KB via route-level splitting.
 *
 * Uses lazyRetry wrapper to auto-reload on stale chunk errors
 * (e.g. after a new deployment, old chunk hashes no longer exist).
 *
 * @module routes/lazyPages
 */

import { lazy, type ComponentType } from 'react';

/**
 * Wraps a dynamic import with retry logic for chunk load failures.
 * On failure, reloads the page once to fetch fresh asset manifests.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyRetry(importFn: () => Promise<{ default: ComponentType<any> }>) {
  return lazy(() =>
    importFn().catch((error: Error) => {
      // Only auto-reload once per session to avoid infinite reload loops
      const KEY = 'chunk_reload_ts';
      const lastReload = sessionStorage.getItem(KEY);
      const now = Date.now();

      if (!lastReload || now - Number(lastReload) > 10_000) {
        sessionStorage.setItem(KEY, String(now));
        window.location.reload();
      }

      throw error;
    })
  );
}

// ── Auth Pages ─────────────────────────────────────────────────────────
export const Login = lazyRetry(() => import('@/pages/auth/login'));
export const Register = lazyRetry(() => import('@/pages/auth/register'));
export const ForgotPassword = lazyRetry(() => import('@/pages/auth/forgot-password'));
export const OAuthCallback = lazyRetry(() => import('@/pages/auth/o-auth-callback'));
export const Onboarding = lazyRetry(() => import('@/pages/auth/onboarding'));
export const ResetPassword = lazyRetry(() => import('@/pages/auth/reset-password'));
export const VerifyEmail = lazyRetry(() => import('@/pages/auth/verify-email'));
export const QrLogin = lazyRetry(() => import('@/pages/auth/login/qr-login'));

// ── Core Messaging ─────────────────────────────────────────────────────
export const Messages = lazyRetry(() => import('@/pages/messages/messages'));
export const Conversation = lazyRetry(() => import('@/pages/messages/conversation'));

// ── Groups ─────────────────────────────────────────────────────────────
export const Groups = lazyRetry(() => import('@/pages/groups/groups'));
export const GroupChannel = lazyRetry(() => import('@/pages/groups/group-channel'));
export const ExploreGroups = lazyRetry(() => import('@/pages/groups/explore-groups'));

// ── Explore (Unified) ──────────────────────────────────────────────────
export const ExplorePage = lazyRetry(() => import('@/pages/explore/explore-page'));

// ── Forums ─────────────────────────────────────────────────────────────
export const Forums = lazyRetry(() => import('@/pages/forums/forums'));
export const ForumPost = lazyRetry(() => import('@/pages/forums/forum-post'));
export const ForumLeaderboard = lazyRetry(() => import('@/pages/forums/forum-leaderboard'));
export const CreateForum = lazyRetry(() => import('@/pages/forums/create-forum'));
export const CreatePost = lazyRetry(() => import('@/pages/forums/create-post'));
export const ForumSettings = lazyRetry(() => import('@/pages/forums/forum-settings'));
export const ForumBoardView = lazyRetry(() => import('@/pages/forums/forum-board-view'));
export const ForumAdmin = lazyRetry(() => import('@/pages/forums/forum-admin'));
export const PluginMarketplace = lazyRetry(() => import('@/pages/forums/plugin-marketplace'));
export const ModerationQueue = lazyRetry(() => import('@/pages/forums/moderation-queue'));
export const ForumSearchResults = lazyRetry(() => import('@/pages/forums/forum-search-results'));

// ── Discovery (Phase 31) ──────────────────────────────────────────────
export const FeedPage = lazyRetry(() => import('@/pages/feed/feed-page'));
export const DiscoverySettings = lazyRetry(() => import('@/pages/settings/discovery/discovery-settings'));

// ── Settings & Profile ─────────────────────────────────────────────────
export const Settings = lazyRetry(() => import('@/pages/settings/settings'));
export const ThemeCustomization = lazyRetry(() => import('@/pages/settings/theme-customization'));
export const AppThemeSettings = lazyRetry(() => import('@/pages/settings/app-theme-settings'));
export const TitleSelection = lazyRetry(() => import('@/pages/settings/title-selection'));
export const BadgeSelection = lazyRetry(() => import('@/pages/settings/badge-selection'));
export const TwoFactorSetup = lazyRetry(() => import('@/pages/settings/two-factor-setup'));
export const BlockedUsers = lazyRetry(() => import('@/pages/settings/blocked-users'));
export const CustomEmoji = lazyRetry(() => import('@/pages/settings/custom-emoji'));
export const RSSFeeds = lazyRetry(() => import('@/pages/settings/rss-feeds'));
export const UserProfile = lazyRetry(() => import('@/pages/profile/user-profile'));
// TODO(phase-26): Rewire — gamification components deleted (UserLeaderboard)

// ── Security ───────────────────────────────────────────────────────────
export const E2EEVerification = lazyRetry(() => import('@/pages/security/e2-ee-verification'));
export const KeyVerification = lazyRetry(() => import('@/pages/security/key-verification'));

// ── Calls ──────────────────────────────────────────────────────────────
export const CallScreen = lazyRetry(() => import('@/pages/calls/call-screen'));
export const CallHistory = lazyRetry(() => import('@/pages/calls/call-history'));

// ── Premium & Gamification ─────────────────────────────────────────────
export const PremiumPage = lazyRetry(() => import('@/pages/premium/premium-page'));
export const CoinShop = lazyRetry(() => import('@/pages/premium/coin-shop'));

// ── Creator ────────────────────────────────────────────────────────────
export const CreatorDashboard = lazyRetry(() => import('@/pages/creator/creator-dashboard'));
export const CreatorEarnings = lazyRetry(() => import('@/pages/creator/earnings-page'));
export const CreatorPayouts = lazyRetry(() => import('@/pages/creator/payout-page'));
export const CreatorAnalytics = lazyRetry(() => import('@/pages/creator/analytics-page'));

// ── Hub Pages ──────────────────────────────────────────────────────────
export const Customize = lazyRetry(() => import('@/pages/customize/customize'));
export const Social = lazyRetry(() => import('@/pages/social/social'));

// ── Members & Community ────────────────────────────────────────────────
export const MemberList = lazyRetry(() => import('@/pages/members/member-list'));
export const WhosOnline = lazyRetry(() => import('@/pages/members/whos-online'));
export const CalendarPage = lazyRetry(() => import('@/pages/calendar/calendar-page'));
export const ReferralPage = lazyRetry(() => import('@/pages/referrals/referral-page'));

// ── Admin ──────────────────────────────────────────────────────────────
export const AdminDashboard = lazyRetry(() => import('@/pages/admin/admin-dashboard'));

// ── Static Pages ───────────────────────────────────────────────────────
export const NotFound = lazyRetry(() => import('@/pages/not-found'));

// ── Dev/Test Pages ─────────────────────────────────────────────────────
export const MatrixTest = lazyRetry(() => import('@/__dev__/test/matrix-test'));
export const EnhancedDemo = lazyRetry(() => import('@/__dev__/test/enhanced-demo'));
export const ThemeApplicationTest = lazyRetry(
  () => import('@/__dev__/test/theme-application-test')
);
