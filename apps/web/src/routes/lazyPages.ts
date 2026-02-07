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
export const Login = lazy(() => import('@/pages/auth/Login'));
export const Register = lazy(() => import('@/pages/auth/Register'));
export const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
export const OAuthCallback = lazy(() => import('@/pages/auth/OAuthCallback'));
export const Onboarding = lazy(() => import('@/pages/auth/Onboarding'));
export const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
export const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'));

// ── Core Messaging ─────────────────────────────────────────────────────
export const Messages = lazy(() => import('@/pages/messages/Messages'));
export const Conversation = lazy(() => import('@/pages/messages/Conversation'));

// ── Groups ─────────────────────────────────────────────────────────────
export const Groups = lazy(() => import('@/pages/groups/Groups'));
export const GroupChannel = lazy(() => import('@/pages/groups/GroupChannel'));

// ── Forums ─────────────────────────────────────────────────────────────
export const Forums = lazy(() => import('@/pages/forums/Forums'));
export const ForumPost = lazy(() => import('@/pages/forums/ForumPost'));
export const ForumLeaderboard = lazy(() => import('@/pages/forums/ForumLeaderboard'));
export const CreateForum = lazy(() => import('@/pages/forums/CreateForum'));
export const CreatePost = lazy(() => import('@/pages/forums/CreatePost'));
export const ForumSettings = lazy(() => import('@/pages/forums/ForumSettings'));
export const ForumBoardView = lazy(() => import('@/pages/forums/ForumBoardView'));
export const ForumAdmin = lazy(() => import('@/pages/forums/ForumAdmin'));
export const PluginMarketplace = lazy(() => import('@/pages/forums/PluginMarketplace'));
export const ModerationQueue = lazy(() => import('@/pages/forums/ModerationQueue'));

// ── Settings & Profile ─────────────────────────────────────────────────
export const Settings = lazy(() => import('@/pages/settings/Settings'));
export const ThemeCustomization = lazy(() => import('@/pages/settings/ThemeCustomization'));
export const AppThemeSettings = lazy(() => import('@/pages/settings/AppThemeSettings'));
export const TitleSelection = lazy(() => import('@/pages/settings/TitleSelection'));
export const BadgeSelection = lazy(() => import('@/pages/settings/BadgeSelection'));
export const TwoFactorSetup = lazy(() => import('@/pages/settings/TwoFactorSetup'));
export const BlockedUsers = lazy(() => import('@/pages/settings/BlockedUsers'));
export const UserProfile = lazy(() => import('@/pages/profile/UserProfile'));
export const UserLeaderboard = lazy(() => import('@/pages/community/UserLeaderboard'));

// ── Calls ──────────────────────────────────────────────────────────────
export const CallScreen = lazy(() => import('@/pages/calls/CallScreen'));

// ── Premium & Gamification ─────────────────────────────────────────────
export const PremiumPage = lazy(() => import('@/pages/premium/PremiumPage'));
export const CoinShop = lazy(() => import('@/pages/premium/CoinShop'));

// ── Hub Pages ──────────────────────────────────────────────────────────
export const Customize = lazy(() => import('@/pages/customize/Customize'));
export const Social = lazy(() => import('@/pages/social/Social'));

// ── Members & Community ────────────────────────────────────────────────
export const MemberList = lazy(() => import('@/pages/members/MemberList'));
export const WhosOnline = lazy(() => import('@/pages/members/WhosOnline'));
export const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage'));
export const ReferralPage = lazy(() => import('@/pages/referrals/ReferralPage'));

// ── Admin ──────────────────────────────────────────────────────────────
export const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));

// ── Static Pages ───────────────────────────────────────────────────────
export const NotFound = lazy(() => import('@/pages/NotFound'));
export const LandingPage = lazy(() => import('@/pages/landing-page'));

// ── Legal Pages ────────────────────────────────────────────────────────
export const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'));
export const TermsOfService = lazy(() => import('@/pages/legal/TermsOfService'));
export const CookiePolicy = lazy(() => import('@/pages/legal/CookiePolicy'));
export const GDPR = lazy(() => import('@/pages/legal/GDPR'));

// ── Company Pages ──────────────────────────────────────────────────────
export const About = lazy(() => import('@/pages/company/About'));
export const Contact = lazy(() => import('@/pages/company/Contact'));
export const Careers = lazy(() => import('@/pages/company/Careers'));
export const Press = lazy(() => import('@/pages/company/Press'));
export const Status = lazy(() => import('@/pages/company/Status'));
export const Blog = lazy(() => import('@/pages/company/Blog'));
export const Documentation = lazy(() => import('@/pages/company/Documentation'));

// ── Dev/Test Pages ─────────────────────────────────────────────────────
export const MatrixTest = lazy(() => import('@/__dev__/test/MatrixTest'));
export const EnhancedDemo = lazy(() => import('@/__dev__/test/EnhancedDemo'));
export const ThemeApplicationTest = lazy(() => import('@/__dev__/test/ThemeApplicationTest'));
export const LandingDemoWorkshop = lazy(() => import('@/__dev__/demo/LandingDemoWorkshop'));
