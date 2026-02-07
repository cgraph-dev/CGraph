/**
 * Authentication route definitions
 *
 * @module routes/routeGroups/authRoutes
 */

import { Route } from 'react-router-dom';
import { PublicRoute } from '../guards';
import AuthLayout from '@/layouts/AuthLayout';
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
      <Route path="/auth/oauth/:provider/callback" element={<OAuthCallback />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
    </>
  );
}
