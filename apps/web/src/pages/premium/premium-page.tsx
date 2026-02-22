/**
 * Premium Subscription Page
 *
 * Displays premium tiers, features, and handles subscription management.
 * Production-ready with:
 * - Three subscription tiers (Free, Premium, Premium Plus)
 * - Feature comparison table
 * - Animated UI elements
 * - Stripe integration ready
 * - Coin balance display
 *
 * Modularized into premium-page/ directory:
 * - types.ts: Type definitions for tiers and features
 * - constants.tsx: Premium tier configurations, FAQ items
 * - utils.ts: Price calculation utilities
 * - PricingCard.tsx: Individual pricing tier card component
 * - FeatureComparisonTable.tsx: Side-by-side feature comparison
 * - FAQSection.tsx: Frequently asked questions
 * - PremiumPage.tsx: Main page component
 */
export { default } from './premium-page/index';
export * from './premium-page/index';
