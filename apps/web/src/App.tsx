import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import { ThemeRegistry } from '@/themes/ThemeRegistry';
import '@/themes/theme-globals.css';

// ============================================================================
// LAYOUTS - Eagerly loaded (always needed)
// ============================================================================
import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';

// ============================================================================
// LOADING COMPONENT - Shown during lazy load
// ============================================================================
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    </div>
  );
}

// ============================================================================
// LAZY-LOADED PAGES - Code split for smaller initial bundle
// Performance: Reduces initial JS from ~500KB to ~150KB
// ============================================================================

// Auth pages (small, load first)
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const OAuthCallback = lazy(() => import('@/pages/auth/OAuthCallback'));
const Onboarding = lazy(() => import('@/pages/auth/Onboarding'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'));

// Core messaging (most used, higher priority)
const Messages = lazy(() => import('@/pages/messages/Messages'));
const Conversation = lazy(() => import('@/pages/messages/Conversation'));

// Social features
const Friends = lazy(() => import('@/pages/friends/Friends'));
const Search = lazy(() => import('@/pages/search/Search'));
const Notifications = lazy(() => import('@/pages/notifications/Notifications'));

// Groups (complex, lazy load)
const Groups = lazy(() => import('@/pages/groups/Groups'));
const GroupChannel = lazy(() => import('@/pages/groups/GroupChannel'));

// Forums (feature-rich, definitely lazy load)
const Forums = lazy(() => import('@/pages/forums/Forums'));
const ForumPost = lazy(() => import('@/pages/forums/ForumPost'));
const ForumLeaderboard = lazy(() => import('@/pages/forums/ForumLeaderboard'));
const CreateForum = lazy(() => import('@/pages/forums/CreateForum'));
const CreatePost = lazy(() => import('@/pages/forums/CreatePost'));
const ForumSettings = lazy(() => import('@/pages/forums/ForumSettings'));
const ForumBoardView = lazy(() => import('@/pages/forums/ForumBoardView'));
const ForumAdmin = lazy(() => import('@/pages/forums/ForumAdmin'));
const PluginMarketplace = lazy(() => import('@/pages/forums/PluginMarketplace'));

// Settings & Profile
const Settings = lazy(() => import('@/pages/settings/Settings'));
const ThemeCustomization = lazy(() => import('@/pages/settings/ThemeCustomization'));
const AppThemeSettings = lazy(() => import('@/pages/settings/AppThemeSettings'));
const TitleSelection = lazy(() => import('@/pages/settings/TitleSelection'));
const BadgeSelection = lazy(() => import('@/pages/settings/BadgeSelection'));
const TwoFactorSetup = lazy(() => import('@/pages/settings/TwoFactorSetup'));
const BlockedUsers = lazy(() => import('@/pages/settings/BlockedUsers'));
const UserProfile = lazy(() => import('@/pages/profile/UserProfile'));
const UserLeaderboard = lazy(() => import('@/pages/community/UserLeaderboard'));

// Calls (WebRTC)
const CallScreen = lazy(() => import('@/pages/calls/CallScreen'));

// Premium & Gamification
const PremiumPage = lazy(() => import('@/pages/premium/PremiumPage'));
const CoinShop = lazy(() => import('@/pages/premium/CoinShop'));
const LeaderboardPage = lazy(() => import('@/pages/leaderboard/LeaderboardPage'));

// Gamification Hub & Pages
const GamificationHubPage = lazy(() => import('@/pages/gamification/GamificationHubPage'));
const AchievementsPage = lazy(() => import('@/pages/gamification/AchievementsPage'));
const QuestsPage = lazy(() => import('@/pages/gamification/QuestsPage'));
const TitlesPage = lazy(() => import('@/pages/gamification/TitlesPage'));

// Customize Hub
const Customize = lazy(() => import('@/pages/customize/Customize'));

// Social Hub
const Social = lazy(() => import('@/pages/social/Social'));

// Members & Community
const MemberList = lazy(() => import('@/pages/members/MemberList'));
const WhosOnline = lazy(() => import('@/pages/members/WhosOnline'));

// Calendar & Events
const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage'));

// Referrals
const ReferralPage = lazy(() => import('@/pages/referrals/ReferralPage'));

// Admin (rarely accessed, always lazy)
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));

// Static pages
const NotFound = lazy(() => import('@/pages/NotFound'));
const LandingPage = lazy(() => import('@/pages/LandingPageOptimized'));

// Legal pages
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/legal/TermsOfService'));
const CookiePolicy = lazy(() => import('@/pages/legal/CookiePolicy'));
const GDPR = lazy(() => import('@/pages/legal/GDPR'));

// Company pages
const About = lazy(() => import('@/pages/company/About'));
const Contact = lazy(() => import('@/pages/company/Contact'));
const Careers = lazy(() => import('@/pages/company/Careers'));
const Press = lazy(() => import('@/pages/company/Press'));
const Status = lazy(() => import('@/pages/company/Status'));

// Test pages (dev only, lazy)
const MatrixTest = lazy(() => import('@/pages/test/MatrixTest'));
const EnhancedDemo = lazy(() => import('@/pages/test/EnhancedDemo'));

// Initialize auth check on app load - non-blocking
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchGamificationData = useGamificationStore((state) => state.fetchGamificationData);
  const { theme, syncWithServer } = useThemeStore();

  useEffect(() => {
    // Run auth check in background - don't block rendering
    if (import.meta.env.DEV) {
      console.log('[AuthInitializer] Starting auth check, hasToken:', !!token);
    }

    checkAuth()
      .catch((error) => {
        console.error('[AuthInitializer] Auth check failed:', error);
      })
      .finally(() => {
        if (import.meta.env.DEV) {
          console.log('[AuthInitializer] Auth check complete');
        }
      });
  }, [checkAuth, token]);

  // Fetch gamification data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (import.meta.env.DEV) {
        console.log('[AuthInitializer] Fetching gamification data...');
      }
      fetchGamificationData().catch((error) => {
        console.error('[AuthInitializer] Gamification fetch failed:', error);
      });
    }
  }, [isAuthenticated, fetchGamificationData]);

  // Apply global theme CSS variables (both app theme and user customizations)
  useEffect(() => {
    // Apply app-wide theme (default, matrix, etc.)
    const appThemeId = localStorage.getItem('cgraph-app-theme') || 'default';
    ThemeRegistry.applyTheme(appThemeId);

    // Also apply user customization colors on top
    const colors = THEME_COLORS[theme.colorPreset];
    const root = document.documentElement;

    root.style.setProperty('--user-theme-primary', colors.primary);
    root.style.setProperty('--user-theme-secondary', colors.secondary);
    root.style.setProperty('--user-theme-glow', colors.glow);
    root.style.setProperty('--user-theme-gradient', colors.gradient);

    if (import.meta.env.DEV) {
      console.log('[ThemeSystem] Applied app theme:', appThemeId);
      console.log('[ThemeSystem] Applied user customizations:', theme.colorPreset, colors);
    }
  }, [theme.colorPreset]);

  // Sync theme with server when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      if (import.meta.env.DEV) {
        console.log('[ThemeSystem] Syncing theme with server for user:', user.id);
      }
      syncWithServer(user.id).catch((error) => {
        console.error('[ThemeSystem] Theme sync failed:', error);
      });
    }
  }, [isAuthenticated, fetchGamificationData]);

  // Always render children immediately - no blocking
  return <>{children}</>;
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (import.meta.env.DEV) {
    console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated);
  }

  // Never block on loading - just check if authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public route wrapper (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (import.meta.env.DEV) {
    console.log('[PublicRoute] isAuthenticated:', isAuthenticated);
  }

  // Never block - just redirect if authenticated
  if (isAuthenticated) {
    return <Navigate to="/messages" replace />;
  }

  return <>{children}</>;
}

// Admin route wrapper (requires authentication + admin role)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  // Never block - just check permissions
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isAdmin) {
    return <Navigate to="/messages" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthInitializer>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Test route for Matrix animation */}
          <Route path="/test/matrix" element={<MatrixTest />} />

          {/* Enhanced Components Demo */}
          <Route path="/test/enhanced" element={<EnhancedDemo />} />

          {/* Public landing page - shown to unauthenticated visitors */}
          <Route path="/" element={<LandingPage />} />

          {/* Legal pages - public access */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/gdpr" element={<GDPR />} />

          {/* Company pages - public access */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/press" element={<Press />} />
          <Route path="/status" element={<Status />} />

          {/* Auth routes */}
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
          {/* OAuth callback - doesn't need layout */}
          <Route path="/auth/oauth/:provider/callback" element={<OAuthCallback />} />

          {/* Password Reset - token-based, no auth needed */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Email Verification - token-based, no auth needed */}
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Messages (DMs) */}
            <Route path="messages" element={<Messages />}>
              <Route path=":conversationId" element={<Conversation />} />
            </Route>

            {/* Social Hub - consolidates friends, notifications, search */}
            <Route path="social" element={<Navigate to="/social/friends" replace />} />
            <Route path="social/:tab" element={<Social />} />

            {/* Redirects for old routes */}
            <Route path="friends" element={<Navigate to="/social/friends" replace />} />
            <Route path="notifications" element={<Navigate to="/social/notifications" replace />} />
            <Route path="search" element={<Navigate to="/social/discover" replace />} />

            {/* Groups */}
            <Route path="groups" element={<Groups />}>
              <Route path=":groupId/channels/:channelId" element={<GroupChannel />} />
            </Route>

            {/* Forums */}
            <Route path="forums" element={<Forums />} />
            <Route path="forums/leaderboard" element={<ForumLeaderboard />} />
            <Route path="forums/create" element={<CreateForum />} />
            <Route path="forums/plugins" element={<PluginMarketplace />} />
            <Route path="forums/:forumSlug" element={<ForumBoardView />} />
            <Route path="forums/:forumSlug/posts" element={<Forums />} />
            <Route path="forums/:forumSlug/create-post" element={<CreatePost />} />
            <Route path="forums/:forumSlug/settings" element={<ForumSettings />} />
            <Route path="forums/:forumSlug/admin" element={<ForumAdmin />} />
            <Route path="forums/:forumSlug/post/:postId" element={<ForumPost />} />
            <Route path="forums/:forumSlug/boards/:boardSlug" element={<ForumBoardView />} />
            <Route path="forums/:forumSlug/threads/:threadId" element={<ForumPost />} />
            <Route path="forums/:forumSlug/plugins" element={<PluginMarketplace />} />

            {/* Settings */}
            <Route path="settings" element={<Settings />} />
            <Route path="settings/:section" element={<Settings />} />
            <Route path="settings/theme" element={<ThemeCustomization />} />
            <Route path="settings/app-theme" element={<AppThemeSettings />} />
            <Route path="settings/titles" element={<TitleSelection />} />
            <Route path="settings/badges" element={<BadgeSelection />} />
            <Route path="settings/security/2fa-setup" element={<TwoFactorSetup />} />
            <Route path="settings/privacy/blocked" element={<BlockedUsers />} />

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

            {/* Premium & Coins */}
            <Route path="premium" element={<PremiumPage />} />
            <Route path="premium/coins" element={<CoinShop />} />

            {/* Customize Hub - all personalization in one place */}
            <Route path="customize" element={<Navigate to="/customize/identity" replace />} />
            <Route path="customize/:category" element={<Customize />} />

            {/* Profile - quick access to own profile */}
            <Route path="profile" element={<Navigate to={`/user/${useAuthStore.getState().user?.id}`} replace />} />

            {/* Redirects for old gamification routes */}
            <Route path="leaderboard" element={<Navigate to="/customize/progression" replace />} />
            <Route path="gamification" element={<Navigate to="/customize/progression" replace />} />
            <Route path="gamification/achievements" element={<Navigate to="/customize/progression" replace />} />
            <Route path="gamification/quests" element={<Navigate to="/customize/progression" replace />} />
            <Route path="gamification/titles" element={<Navigate to="/customize/identity" replace />} />
            <Route path="achievements" element={<Navigate to="/customize/progression" replace />} />
            <Route path="quests" element={<Navigate to="/customize/progression" replace />} />
            <Route path="titles" element={<Navigate to="/customize/identity" replace />} />

            {/* User Profile */}

            {/* Voice/Video Calls */}
            <Route path="call/:recipientId/:callType" element={<CallScreen />} />

            {/* Onboarding (first-time user experience) */}
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="user/:userId" element={<UserProfile />} />
            <Route path="u/:userId" element={<UserProfile />} />

            {/* Admin Dashboard - requires admin role */}
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
      </Suspense>
    </AuthInitializer>
  );
}
