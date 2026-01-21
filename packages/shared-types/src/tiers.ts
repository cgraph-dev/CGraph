/**
 * Tier Limits Types
 * 
 * Shared types for subscription tiers and feature limits.
 * Used by both web and mobile clients.
 * 
 * Tiers (from FORUM_SOCIAL_NETWORK_INTEGRATION.md):
 * - free: 1 forum, 100MB storage, basic features
 * - premium: 5 forums, 5GB storage, advanced AI moderation
 * - enterprise: unlimited forums, unlimited storage, custom AI models
 */

// =============================================================================
// Tier Enums & Constants
// =============================================================================

/**
 * Available subscription tiers (3 tiers as per documentation)
 */
export type TierName = 'free' | 'premium' | 'enterprise';

/**
 * Support levels available per tier
 */
export type SupportLevel = 'community' | 'priority' | 'dedicated';

/**
 * Tier order for comparison (higher = better)
 */
export const TIER_ORDER: Record<TierName, number> = {
  free: 0,
  premium: 1,
  enterprise: 2,
};

/**
 * Tier limits as defined in documentation
 */
export const TIER_LIMITS: Record<TierName, { maxForums: number | null; maxStorageBytes: number | null }> = {
  free: { maxForums: 1, maxStorageBytes: 100 * 1024 * 1024 },         // 100MB
  premium: { maxForums: 5, maxStorageBytes: 5 * 1024 * 1024 * 1024 }, // 5GB
  enterprise: { maxForums: null, maxStorageBytes: null },              // Unlimited
};

// =============================================================================
// Core Tier Types
// =============================================================================

/**
 * Basic tier information (returned from list endpoint)
 */
export interface TierBasic {
  id: string;
  tier: TierName;
  display_name: string;
  description: string | null;
  position: number;
  badge_color: string | null;
  badge_icon: string | null;
  price_monthly_cents: number;
  price_yearly_cents: number;
}

/**
 * Forum-related limits
 */
export interface ForumLimits {
  max_owned: number | null;
  max_joined: number | null;
  max_boards: number | null;
  max_threads_per_day: number | null;
  max_posts_per_day: number | null;
}

/**
 * Storage-related limits
 */
export interface StorageLimits {
  max_bytes: number | null;
  max_file_size: number | null;
  formatted_max: string;
}

/**
 * AI feature flags
 */
export interface AIFeatures {
  moderation_enabled: boolean;
  suggestions_enabled: boolean;
  search_enabled: boolean;
}

/**
 * Feature flags
 */
export interface TierFeatureFlags {
  custom_css: boolean;
  custom_themes: boolean;
  custom_domain: boolean;
  video_calls: boolean;
  api_access: boolean;
  webhooks: boolean;
  priority_queue: boolean;
  early_access: boolean;
}

/**
 * Full tier limits (returned from show endpoint with include_limits)
 */
export interface TierLimits {
  forums: ForumLimits;
  storage: StorageLimits;
  ai: AIFeatures;
}

/**
 * Full tier details with all limits and features
 */
export interface TierFull extends TierBasic {
  limits: TierLimits;
  features: TierFeatureFlags;
}

// =============================================================================
// User Tier Types
// =============================================================================

/**
 * Override for a specific limit
 */
export interface TierOverride {
  limit_key: string;
  value: string;
  reason: string | null;
  expires_at: string | null;
}

/**
 * Effective limits for the current user
 */
export interface EffectiveLimits {
  max_forums_owned: number | null;
  max_storage_bytes: number | null;
  max_threads_per_day: number | null;
}

/**
 * User's tier information with overrides
 */
export interface UserTierInfo {
  tier: TierFull | null;
  overrides: TierOverride[];
  effective_limits: EffectiveLimits;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Response from GET /api/v1/tiers
 */
export interface TiersListResponse {
  data: TierBasic[];
  meta: {
    count: number;
  };
}

/**
 * Response from GET /api/v1/tiers/:tier
 */
export interface TierShowResponse {
  data: TierFull;
}

/**
 * Response from GET /api/v1/tiers/me
 */
export interface MyTierResponse {
  data: UserTierInfo;
}

/**
 * Tier difference for comparison
 */
export interface TierDifference {
  field: string;
  from: string | number | boolean;
  to: string | number | boolean;
  change: 'increase' | 'decrease' | 'equal';
}

/**
 * Response from GET /api/v1/tiers/compare
 */
export interface TierCompareResponse {
  data: {
    from: TierFull;
    to: TierFull;
    is_upgrade: boolean;
    differences: TierDifference[];
  };
}

/**
 * Response from GET /api/v1/tiers/check/:action
 */
export interface TierCheckActionResponse {
  data: {
    allowed: boolean;
    limit: number | null;
    current: number;
  };
}

/**
 * Response from GET /api/v1/tiers/features/:feature
 */
export interface TierCheckFeatureResponse {
  data: {
    feature: string;
    enabled: boolean;
  };
}

// =============================================================================
// AI Moderation Types (Prepared for v1.1)
// =============================================================================

/**
 * Content types that can be moderated
 */
export type ModerableContentType = 'thread' | 'post' | 'comment' | 'user_profile';

/**
 * Severity levels for moderation
 */
export type ModerationSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Moderation status
 */
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

/**
 * Suggested actions from AI moderation
 */
export type ModerationAction = 'approve' | 'flag' | 'hide' | 'remove' | 'ban';

/**
 * AI moderation queue item
 */
export interface AIModerationQueueItem {
  id: string;
  forum_id: string;
  content_type: ModerableContentType;
  content_id: string;
  content_text: string | null;
  
  // AI analysis
  ai_model: string | null;
  confidence_score: number | null;
  categories: string[];
  severity: ModerationSeverity | null;
  suggested_action: ModerationAction | null;
  auto_actioned: boolean;
  
  // Status
  status: ModerationStatus;
  reviewed_by_id: string | null;
  reviewed_at: string | null;
  final_action: ModerationAction | null;
  
  // Timestamps
  inserted_at: string;
  updated_at: string;
}

/**
 * AI moderation settings for a forum
 */
export interface AIModerationSettings {
  id: string;
  forum_id: string;
  enabled: boolean;
  auto_moderation_enabled: boolean;
  
  // Thresholds (0.0 - 1.0)
  spam_threshold: number;
  toxicity_threshold: number;
  nsfw_threshold: number;
  low_quality_threshold: number;
  
  // Auto-actions
  auto_remove_spam: boolean;
  auto_remove_spam_threshold: number;
  auto_hide_toxicity: boolean;
  auto_hide_toxicity_threshold: number;
  auto_flag_nsfw: boolean;
  notify_on_auto_action: boolean;
  
  // Exemptions
  exempt_roles: string[];
  exempt_karma_threshold: number;
  
  // Custom rules
  custom_banned_words: string[];
  custom_allowed_words: string[];
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if a limit is unlimited (null means unlimited)
 */
export function isUnlimited(limit: number | null): boolean {
  return limit === null;
}

/**
 * Check if within limit
 */
export function withinLimit(limit: number | null, current: number): boolean {
  return limit === null || current < limit;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'Unlimited';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format a limit value for display
 */
export function formatLimit(value: number | null): string {
  return value === null ? 'Unlimited' : value.toString();
}

/**
 * Compare two tiers and return if upgrading
 */
export function isUpgrade(fromTier: TierName, toTier: TierName): boolean {
  return TIER_ORDER[toTier] > TIER_ORDER[fromTier];
}

/**
 * Get monthly price in dollars
 */
export function getMonthlyPrice(tier: TierBasic): string {
  if (tier.price_monthly_cents === 0) return 'Free';
  return `$${(tier.price_monthly_cents / 100).toFixed(2)}/mo`;
}

/**
 * Get yearly price in dollars with savings
 */
export function getYearlyPrice(tier: TierBasic): { price: string; savings: string } {
  if (tier.price_yearly_cents === 0) return { price: 'Free', savings: '' };
  
  const yearlyPrice = tier.price_yearly_cents / 100;
  const monthlyEquivalent = yearlyPrice / 12;
  const monthlyFull = tier.price_monthly_cents / 100;
  const savingsPercent = Math.round((1 - monthlyEquivalent / monthlyFull) * 100);
  
  return {
    price: `$${yearlyPrice.toFixed(2)}/yr`,
    savings: savingsPercent > 0 ? `Save ${savingsPercent}%` : '',
  };
}
