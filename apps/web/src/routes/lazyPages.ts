/**
 * Lazy Page Imports
 *
 * Code-split page declarations for smaller initial bundle size.
 * Reduces initial JS from ~500KB to ~150KB via route-level splitting.
 *
 * @module routes/lazyPages
 */

import { lazy } from 'react';

// ── Auth Pages ─────────────────────────────────────────────────────────
export const Login = lazy(() => import('@/pages/auth/login'));
export const Register = lazy(() => import('@/pages/auth/register'));
export const ForgotPassword = lazy(() => import('@/pages/auth/forgot-password'));
export const OAuthCallback = lazy(() => import('@/pages/auth/o-auth-callback'));
export const Onboarding = lazy(() => import('@/pages/auth/onboarding'));
export const ResetPassword = lazy(() => import('@/pages/auth/reset-password'));
export const VerifyEmail = lazy(() => import('@/pages/auth/verify-email'));
export const QrLogin = lazy(() => import('@/pages/auth/login/qr-login'));

// ── Core Messaging ─────────────────────────────────────────────────────
export const Messages = lazy(() => import('@/pages/messages/messages'));
export const Conversation = lazy(() => import('@/pages/messages/conversation'));

// ── Groups ─────────────────────────────────────────────────────────────
export const Groups = lazy(() => import('@/pages/groups/groups'));
export const GroupChannel = lazy(() => import('@/pages/groups/group-channel'));
export const ExploreGroups = lazy(() => import('@/pages/groups/explore-groups'));

// ── Explore (Unified) ──────────────────────────────────────────────────
export const ExplorePage = lazy(() => import('@/pages/explore/explore-page'));

// ── Forums ─────────────────────────────────────────────────────────────
export const Forums = lazy(() => import('@/pages/forums/forums'));
export const ForumPost = lazy(() => import('@/pages/forums/forum-post'));
export const ForumLeaderboard = lazy(() => import('@/pages/forums/forum-leaderboard'));
export const CreateForum = lazy(() => import('@/pages/forums/create-forum'));
export const CreatePost = lazy(() => import('@/pages/forums/create-post'));
export const ForumSettings = lazy(() => import('@/pages/forums/forum-settings'));
export const ForumBoardView = lazy(() => import('@/pages/forums/forum-board-view'));
export const ForumAdmin = lazy(() => import('@/pages/forums/forum-admin'));
export const PluginMarketplace = lazy(() => import('@/pages/forums/plugin-marketplace'));
export const ModerationQueue = lazy(() => import('@/pages/forums/moderation-queue'));
export const ForumSearchResults = lazy(() => import('@/pages/forums/forum-search-results'));

// ── Settings & Profile ─────────────────────────────────────────────────
export const Settings = lazy(() => import('@/pages/settings/settings'));
export const ThemeCustomization = lazy(() => import('@/pages/settings/theme-customization'));
export const AppThemeSettings = lazy(() => import('@/pages/settings/app-theme-settings'));
export const TitleSelection = lazy(() => import('@/pages/settings/title-selection'));
export const BadgeSelection = lazy(() => import('@/pages/settings/badge-selection'));
export const TwoFactorSetup = lazy(() => import('@/pages/settings/two-factor-setup'));
export const BlockedUsers = lazy(() => import('@/pages/settings/blocked-users'));
export const CustomEmoji = lazy(() => import('@/pages/settings/custom-emoji'));
export const RSSFeeds = lazy(() => import('@/pages/settings/rss-feeds'));
export const UserProfile = lazy(() => import('@/pages/profile/user-profile'));
export const UserLeaderboard = lazy(() => import('@/pages/community/user-leaderboard'));

// ── Security ───────────────────────────────────────────────────────────
export const E2EEVerification = lazy(() => import('@/pages/security/e2-ee-verification'));
export const KeyVerification = lazy(() => import('@/pages/security/key-verification'));

// ── Calls ──────────────────────────────────────────────────────────────
export const CallScreen = lazy(() => import('@/pages/calls/call-screen'));
export const CallHistory = lazy(() => import('@/pages/calls/call-history'));

// ── Premium & Gamification ─────────────────────────────────────────────
export const PremiumPage = lazy(() => import('@/pages/premium/premium-page'));
export const CoinShop = lazy(() => import('@/pages/premium/coin-shop'));

// ── Hub Pages ──────────────────────────────────────────────────────────
export const Customize = lazy(() => import('@/pages/customize/customize'));
export const Social = lazy(() => import('@/pages/social/social'));

// ── Members & Community ────────────────────────────────────────────────
export const MemberList = lazy(() => import('@/pages/members/member-list'));
export const WhosOnline = lazy(() => import('@/pages/members/whos-online'));
export const CalendarPage = lazy(() => import('@/pages/calendar/calendar-page'));
export const ReferralPage = lazy(() => import('@/pages/referrals/referral-page'));

// ── Admin ──────────────────────────────────────────────────────────────
export const AdminDashboard = lazy(() => import('@/pages/admin/admin-dashboard'));

// ── Static Pages ───────────────────────────────────────────────────────
export const NotFound = lazy(() => import('@/pages/not-found'));

// ── Dev/Test Pages ─────────────────────────────────────────────────────
export const MatrixTest = lazy(() => import('@/__dev__/test/matrix-test'));
export const EnhancedDemo = lazy(() => import('@/__dev__/test/enhanced-demo'));
export const ThemeApplicationTest = lazy(() => import('@/__dev__/test/theme-application-test'));
