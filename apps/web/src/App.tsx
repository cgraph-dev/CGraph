import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Layouts
import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import OAuthCallback from '@/pages/auth/OAuthCallback';
import Messages from '@/pages/messages/Messages';
import Conversation from '@/pages/messages/Conversation';
import Friends from '@/pages/friends/Friends';
import Search from '@/pages/search/Search';
import Groups from '@/pages/groups/Groups';
import GroupChannel from '@/pages/groups/GroupChannel';
import Forums from '@/pages/forums/Forums';
import ForumPost from '@/pages/forums/ForumPost';
import ForumLeaderboard from '@/pages/forums/ForumLeaderboard';
import CreateForum from '@/pages/forums/CreateForum';
import CreatePost from '@/pages/forums/CreatePost';
import ForumSettings from '@/pages/forums/ForumSettings';
import ForumBoardView from '@/pages/forums/ForumBoardView';
import PluginMarketplace from '@/pages/forums/PluginMarketplace';
import Settings from '@/pages/settings/Settings';
import Notifications from '@/pages/notifications/Notifications';
import UserProfile from '@/pages/profile/UserProfile';
import UserLeaderboard from '@/pages/community/UserLeaderboard';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import NotFound from '@/pages/NotFound';
import MatrixTest from '@/pages/test/MatrixTest';
import EnhancedDemo from '@/pages/test/EnhancedDemo';

// Premium & Gamification
import PremiumPage from '@/pages/premium/PremiumPage';
import CoinShop from '@/pages/premium/CoinShop';
import LeaderboardPage from '@/pages/leaderboard/LeaderboardPage';

// Initialize auth check on app load - non-blocking
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    // Run auth check in background - don't block rendering
    if (import.meta.env.DEV) {
      console.log('[AuthInitializer] Starting auth check, hasToken:', !!token);
    }
    
    checkAuth().catch((error) => {
      console.error('[AuthInitializer] Auth check failed:', error);
    }).finally(() => {
      if (import.meta.env.DEV) {
        console.log('[AuthInitializer] Auth check complete');
      }
    });
  }, [checkAuth, token]);

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
      <Routes>
        {/* Test route for Matrix animation */}
        <Route path="/test/matrix" element={<MatrixTest />} />
        
        {/* Enhanced Components Demo */}
        <Route path="/test/enhanced" element={<EnhancedDemo />} />
        
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Navigate to="/login" replace />
            </PublicRoute>
          }
        />
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
        <Route
          path="/auth/oauth/:provider/callback"
          element={<OAuthCallback />}
        />

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

          {/* Friends */}
          <Route path="friends" element={<Friends />} />

          {/* Notifications */}
          <Route path="notifications" element={<Notifications />} />

          {/* Search */}
          <Route path="search" element={<Search />} />

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
          <Route path="forums/:forumSlug/post/:postId" element={<ForumPost />} />
          <Route path="forums/:forumSlug/boards/:boardSlug" element={<ForumBoardView />} />
          <Route path="forums/:forumSlug/threads/:threadId" element={<ForumPost />} />
          <Route path="forums/:forumSlug/plugins" element={<PluginMarketplace />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />
          <Route path="settings/:section" element={<Settings />} />

          {/* Community */}
          <Route path="community/leaderboard" element={<UserLeaderboard />} />

          {/* Premium & Coins */}
          <Route path="premium" element={<PremiumPage />} />
          <Route path="premium/coins" element={<CoinShop />} />

          {/* Gamification Leaderboard */}
          <Route path="leaderboard" element={<LeaderboardPage />} />

          {/* User Profile */}
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
    </AuthInitializer>
  );
}
