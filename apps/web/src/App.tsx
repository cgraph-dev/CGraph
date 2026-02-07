import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { useCustomizationStore } from '@/stores/customization';
import { ThemeRegistry } from '@/themes/ThemeRegistry';
import { useCustomizationApplication } from '@/hooks/useCustomizationApplication';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { authLogger, themeLogger, gamificationLogger, routeLogger } from '@/lib/logger';
import '@/themes/theme-globals.css';
import '@/styles/customization-effects.css';

// ============================================================================
// LAYOUTS - Eagerly loaded (always needed)
// ============================================================================
import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';

// ============================================================================
// GLOBAL HANDLERS - Must be eagerly loaded
// ============================================================================
import { IncomingCallHandler } from '@/modules/calls/components/IncomingCallHandler';

// ============================================================================
// SCROLL TO TOP - Ensures page starts at top on navigation
// ============================================================================
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
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

// Social features (Friends, Search, Notifications moved to Social hub)

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
const ModerationQueue = lazy(() => import('@/pages/forums/ModerationQueue'));

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
// Gamification (LeaderboardPage and gamification hub pages moved to /customize/progression)

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
const LandingPage = lazy(() => import('@/pages/landing-page'));

// Legal pages
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/legal/TermsOfService'));
const CookiePolicy = lazy(() => import('@/pages/legal/CookiePolicy'));
const GDPR = lazy(() => import('@/pages/legal/GDPR'));

// Product pages removed - now handled as sections in LandingPage

// Company pages
const About = lazy(() => import('@/pages/company/About'));
const Contact = lazy(() => import('@/pages/company/Contact'));
const Careers = lazy(() => import('@/pages/company/Careers'));
const Press = lazy(() => import('@/pages/company/Press'));
const Status = lazy(() => import('@/pages/company/Status'));
const Blog = lazy(() => import('@/pages/company/Blog'));
const Documentation = lazy(() => import('@/pages/company/Documentation'));

// Test pages (dev only, lazy) - moved to __dev__ directory
const MatrixTest = lazy(() => import('@/__dev__/test/MatrixTest'));
const EnhancedDemo = lazy(() => import('@/__dev__/test/EnhancedDemo'));
const ThemeApplicationTest = lazy(() => import('@/__dev__/test/ThemeApplicationTest'));

// Demo pages - moved to __dev__ directory
const LandingDemoWorkshop = lazy(() => import('@/__dev__/demo/LandingDemoWorkshop'));

// Initialize auth check on app load - non-blocking
function AuthInitializer({ children }: { children: React.ReactNode }) {
  // Use stable selectors - select individual values, not objects that change on every render
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const fetchGamificationData = useGamificationStore((state) => state.fetchGamificationData);
  const colorPreset = useThemeStore((state) => state.theme.colorPreset);
  const syncWithServer = useThemeStore((state) => state.syncWithServer);
  const fetchCustomizations = useCustomizationStore((state) => state.fetchCustomizations);

  // Apply customization settings to UI
  useCustomizationApplication();

  // Auth check - runs once on mount only
  useEffect(() => {
    authLogger.debug('Starting auth check on mount');
    checkAuth()
      .catch((error) => {
        authLogger.error(error, 'Auth check failed');
      })
      .finally(() => {
        authLogger.debug('Auth check complete');
      });
    // Only run on mount - checkAuth is stable from zustand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch gamification data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      gamificationLogger.debug('Fetching gamification data...');
      fetchGamificationData().catch((error) => {
        gamificationLogger.error(error, 'Gamification fetch failed');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Initialize unified customization store when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomizations().catch((error) => {
        authLogger.error('Customization initialization failed:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Apply global theme CSS variables (both app theme and user customizations)
  useEffect(() => {
    // Apply app-wide theme (default, matrix, etc.)
    const appThemeId = localStorage.getItem('cgraph-app-theme') || 'default';
    ThemeRegistry.applyTheme(appThemeId);

    // Also apply user customization colors on top
    const colors = THEME_COLORS[colorPreset];
    if (colors) {
      const root = document.documentElement;
      root.style.setProperty('--user-theme-primary', colors.primary);
      root.style.setProperty('--user-theme-secondary', colors.secondary);
      root.style.setProperty('--user-theme-glow', colors.glow);
      root.style.setProperty('--user-theme-gradient', colors.gradient);
      themeLogger.debug('Applied user customizations:', colorPreset, colors);
    }
    themeLogger.debug('Applied app theme:', appThemeId);
  }, [colorPreset]);

  // Sync theme with server when user logs in
  useEffect(() => {
    if (isAuthenticated && userId) {
      themeLogger.debug('Syncing theme with server for user:', userId);
      syncWithServer(userId).catch((error) => {
        themeLogger.error(error, 'Theme sync failed');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userId]);

  // Always render children immediately - no blocking
  return <>{children}</>;
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  routeLogger.debug('ProtectedRoute isAuthenticated:', isAuthenticated);

  // Never block on loading - just check if authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public route wrapper (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  routeLogger.debug('PublicRoute isAuthenticated:', isAuthenticated);

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

// Profile redirect - waits for auth state before redirecting to user's profile
function ProfileRedirectRoute() {
  const { user, isAuthenticated } = useAuthStore();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is loaded and has an ID, redirect to their profile
  if (user?.id) {
    return <Navigate to={`/user/${user.id}`} replace />;
  }

  // While loading, show loading spinner
  return <LoadingSpinner />;
}

// Landing route - Discord-style: redirect authenticated users to app, show landing to guests
function LandingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  routeLogger.debug('LandingRoute isAuthenticated:', isAuthenticated);

  // Authenticated users go directly to messages (like Discord redirects to app)
  if (isAuthenticated) {
    return <Navigate to="/messages" replace />;
  }

  // Unauthenticated users see the landing page
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthInitializer>
      <ScrollToTop />
      <IncomingCallHandler />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Test route for Matrix animation */}
          <Route path="/test/matrix" element={<MatrixTest />} />

          {/* Enhanced Components Demo */}
          <Route path="/test/enhanced" element={<EnhancedDemo />} />

          {/* Theme Application Test */}
          <Route path="/test/theme" element={<ThemeApplicationTest />} />

          {/* Demo: Workshop page for continued customization */}
          <Route path="/demo/workshop" element={<LandingDemoWorkshop />} />

          {/*
           * Public landing page - Discord-style architecture:
           * - Unauthenticated users see the marketing landing page
           * - Authenticated users are redirected to /messages (the app)
           * This mirrors Discord's behavior: discord.com → app.discord.com for logged-in users
           */}
          <Route
            path="/"
            element={
              <LandingRoute>
                <LandingPage />
              </LandingRoute>
            }
          />

          {/* Product sections - scroll to LandingPage sections via /#features, /#security, /#pricing */}

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
          <Route path="/blog" element={<Blog />} />
          <Route path="/docs" element={<Documentation />} />

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

            {/* Forums - wrapped with RouteErrorBoundary for isolation */}
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

            {/* Settings - wrapped with RouteErrorBoundary */}
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

            {/* Premium & Coins */}
            <Route path="premium" element={<PremiumPage />} />
            <Route path="premium/coins" element={<CoinShop />} />

            {/* Customize Hub - all personalization in one place */}
            <Route path="customize" element={<Navigate to="/customize/identity" replace />} />
            <Route path="customize/:category" element={<Customize />} />

            {/* Profile - quick access to own profile */}
            <Route path="profile" element={<ProfileRedirectRoute />} />

            {/* Redirects for old gamification routes */}
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
            <Route
              path="gamification/titles"
              element={<Navigate to="/customize/identity" replace />}
            />
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
