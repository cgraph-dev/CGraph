/**
 * Public route definitions
 *
 * Legal/company pages are served by the landing app at cgraph.org
 * and redirected via Vercel config.
 *
 * Root "/" is handled by the ProtectedRoute layout in AppRoutes:
 * - Authenticated → AppLayout (/messages, etc.)
 * - Unauthenticated → redirected to /login
 *
 * @module routes/route-groups/public-routes
 */

// No public page routes — all public content lives in the landing app (cgraph.org).
// Auth routes are in authRoutes.tsx.
