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
import NotFound from '@/pages/NotFound';

// Initialize auth check on app load
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public route wrapper (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/messages" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthInitializer>
      <Routes>
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

          {/* User Profile */}
          <Route path="user/:userId" element={<UserProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthInitializer>
  );
}
