/**
 * Authentication route definitions
 *
 * @module routes/route-groups/auth-routes
 */

import { Route } from 'react-router-dom';
import { PublicRoute } from '../guards';
import { RouteErrorBoundary } from '@/components/feedback/route-error-boundary';
import AuthLayout from '@/layouts/auth-layout';
import {
  Login,
  Register,
  ForgotPassword,
  OAuthCallback,
  ResetPassword,
  VerifyEmail,
} from '../lazyPages';

/** Auth routes (login, register, password reset, etc.) */
export function AuthRoutes() {
  return (
    <>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <RouteErrorBoundary routeName="Login">
                <Login />
              </RouteErrorBoundary>
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <RouteErrorBoundary routeName="Register">
                <Register />
              </RouteErrorBoundary>
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <AuthLayout>
              <RouteErrorBoundary routeName="Forgot Password">
                <ForgotPassword />
              </RouteErrorBoundary>
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/auth/oauth/:provider/callback"
        element={
          <RouteErrorBoundary routeName="OAuth Callback">
            <OAuthCallback />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="/reset-password"
        element={
          <RouteErrorBoundary routeName="Reset Password">
            <ResetPassword />
          </RouteErrorBoundary>
        }
      />
      <Route
        path="/verify-email"
        element={
          <RouteErrorBoundary routeName="Verify Email">
            <VerifyEmail />
          </RouteErrorBoundary>
        }
      />
    </>
  );
}
